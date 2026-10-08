import type { Edge, Node } from '@xyflow/react';
import { collectPortalIds, isPortalId, normalizePortalId } from './ids';
import { parsePortalNodeData } from './parse';
import { portalIncomingEdges, portalOutgoingEdges, portalRole } from './role';

export interface PortalIssue {
  nodeId: string;
  message: string;
  code: string;
}

export function validatePortalGraph(nodes: Node[], edges: Edge[]): PortalIssue[] {
  const issues: PortalIssue[] = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (node.type !== 'portal') continue;
    const data = parsePortalNodeData(node.data, '');
    if (!isPortalId(data.portalId)) {
      issues.push({
        nodeId: node.id,
        code: 'missing_id',
        message: 'This portal needs a Portal ID.',
      });
    } else if (seen.has(data.portalId)) {
      issues.push({
        nodeId: node.id,
        code: 'duplicate_id',
        message: `Portal ID ${data.portalId} is used more than once.`,
      });
    } else {
      seen.add(data.portalId);
    }

    const inCount = portalIncomingEdges(node.id, edges).length;
    const outCount = portalOutgoingEdges(node.id, edges).length;
    const role = portalRole(node.id, edges);
    if (role === 'invalid' || (inCount > 0 && outCount > 0)) {
      issues.push({
        nodeId: node.id,
        code: 'both_wired',
        message:
          'A portal can leave this playlist or receive from another playlist, never both. Disconnect one side.',
      });
    }
    if (inCount > 1) {
      issues.push({
        nodeId: node.id,
        code: 'many_in',
        message: 'A portal can have only one incoming path.',
      });
    }
    if (outCount > 1) {
      issues.push({
        nodeId: node.id,
        code: 'many_out',
        message: 'A portal can have only one outgoing path.',
      });
    }

    if (role === 'exit') {
      if (!data.destination?.playlistId) {
        issues.push({
          nodeId: node.id,
          code: 'missing_destination',
          message: 'Set a destination playlist for this exit.',
        });
      } else if (data.destination.mode === 'portal' && !isPortalId(data.destination.portalId)) {
        issues.push({
          nodeId: node.id,
          code: 'missing_target_portal',
          message: 'Pick a destination portal, or send playback to the playlist beginning.',
        });
      } else if (
        data.destination.mode === 'portal' &&
        normalizePortalId(data.destination.portalId) === data.portalId &&
        data.destination.type === 'internal' &&
        !data.destination.playlistId
      ) {
        issues.push({
          nodeId: node.id,
          code: 'self_target',
          message: 'A portal cannot target itself.',
        });
      }
    }
  }

  void collectPortalIds(nodes);
  return issues;
}

export function editorPortalStatus(
  node: Node,
  edges: Edge[],
  issues: PortalIssue[]
): string {
  const mine = issues.filter((issue) => issue.nodeId === node.id);
  if (mine.length) return mine[0].message;
  const role = portalRole(node.id, edges);
  if (role === 'unset') {
    return 'Connect one side only: into this portal to leave, or out of it to receive.';
  }
  if (role === 'exit') return 'Exit — playback leaves this playlist here.';
  if (role === 'entry') return 'Entry — playback from another playlist continues here.';
  return 'Invalid wiring.';
}
