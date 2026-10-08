import type { Edge, Node } from '@xyflow/react';
import { portalHandleEnabled, portalIncomingEdges, portalOutgoingEdges, portalRole } from './role';
import { MAX_PORTAL_INPUTS, PORTAL_IN_HANDLE, PORTAL_OUT_HANDLE } from './types';

function playEdges(edges: Edge[]): Edge[] {
  return edges.filter((edge) => !String(edge.id || '').startsWith('dashed-'));
}

export function portalConnectError(
  connection: {
    source?: string | null;
    target?: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  nodes: Node[],
  edges: Edge[]
): string | null {
  if (!connection.source || !connection.target) return 'Incomplete connection.';
  if (connection.source === connection.target) {
    return 'A portal cannot connect to itself.';
  }
  const live = playEdges(edges);
  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);
  if (!sourceNode || !targetNode) return 'Missing node.';

  if (targetNode.type === 'portal') {
    const role = portalRole(targetNode.id, live);
    if (!portalHandleEnabled(role, PORTAL_IN_HANDLE)) {
      return 'This portal is already an entry from another playlist. Disconnect the exit path first.';
    }
    if (portalIncomingEdges(targetNode.id, live).length >= MAX_PORTAL_INPUTS) {
      return 'This portal already has two incoming paths.';
    }
  }

  if (sourceNode.type === 'portal') {
    const role = portalRole(sourceNode.id, live);
    if (!portalHandleEnabled(role, PORTAL_OUT_HANDLE)) {
      return 'This portal is already leaving this playlist. Disconnect the incoming path first.';
    }
    if (portalOutgoingEdges(sourceNode.id, live).length > 0) {
      return 'This portal already has an outgoing path. Portals take one connection, as an exit or an entry — not both.';
    }
  }

  return null;
}

export function portalConnectionHandles(
  sourceType: string | undefined,
  targetType: string | undefined
): { sourceHandle?: string; targetHandle?: string } {
  return {
    ...(sourceType === 'portal' ? { sourceHandle: PORTAL_OUT_HANDLE } : {}),
    ...(targetType === 'portal' ? { targetHandle: PORTAL_IN_HANDLE } : {}),
  };
}
