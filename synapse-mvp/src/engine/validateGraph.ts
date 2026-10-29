import type { Edge, Node } from '@xyflow/react';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface GraphIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
}

const PLAYBACK_TYPES = new Set([
  'start',
  'track',
  'conditional',
  'splitter',
  'randomizer',
  'transition',
  'style',
  'end',
]);

function isComment(node: Node | undefined): boolean {
  return node?.type === 'comment';
}

function isPlaybackNode(node: Node): boolean {
  return PLAYBACK_TYPES.has(String(node.type || ''));
}

function outgoing(edges: Edge[], nodeId: string): Edge[] {
  return edges.filter((edge) => edge.source === nodeId);
}

function startNode(nodes: Node[]): Node | undefined {
  return nodes.find((node) => node.type === 'start' && !node.hidden);
}

function walkReachable(nodes: Node[], edges: Edge[], originId: string): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  const stack = [originId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = byId.get(id);
    if (!node || isComment(node)) continue;
    for (const edge of outgoing(edges, id)) {
      if (byId.has(edge.target)) stack.push(edge.target);
    }
    if (node.type === 'randomizer') {
      for (const trackId of (node.data?.tracks as string[]) || []) {
        if (byId.has(trackId)) stack.push(trackId);
      }
    }
  }
  return seen;
}

export function validateGraph(nodes: Node[], edges: Edge[]): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visible = nodes.filter((node) => !node.hidden);
  const starts = visible.filter((node) => node.type === 'start');

  if (starts.length === 0) {
    issues.push({
      id: 'missing-start',
      severity: 'error',
      message: 'Add a Start node. Playback needs one origin.',
    });
  } else if (starts.length > 1) {
    issues.push({
      id: 'multiple-start',
      severity: 'error',
      message: 'There can only be one Start node.',
      nodeId: starts[1]?.id,
    });
  }

  for (const edge of edges) {
    if (String(edge.id).startsWith('dashed-')) continue;
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) {
      issues.push({
        id: `dangling-${edge.id}`,
        severity: 'error',
        message: 'A connection points at a missing node.',
        nodeId: source?.id || target?.id,
      });
      continue;
    }
    if (isComment(source) || isComment(target)) {
      issues.push({
        id: `comment-edge-${edge.id}`,
        severity: 'error',
        message: 'Comment nodes cannot join the play path.',
        nodeId: isComment(source) ? source.id : target.id,
      });
    }
  }

  const origin = startNode(nodes);
  const reachable = origin ? walkReachable(nodes, edges, origin.id) : new Set<string>();

  for (const node of visible) {
    if (isComment(node) || node.type === 'start') continue;
    if (!isPlaybackNode(node)) continue;
    if (origin && !reachable.has(node.id)) {
      issues.push({
        id: `unreachable-${node.id}`,
        severity: 'warning',
        message: 'This node is not reachable from Start.',
        nodeId: node.id,
      });
    }
  }

  for (const node of visible) {
    if (node.type === 'track') {
      const videoId = String(node.data?.videoId || '').trim();
      if (!videoId) {
        issues.push({
          id: `track-media-${node.id}`,
          severity: 'warning',
          message: 'This Track has no YouTube video yet.',
          nodeId: node.id,
        });
      }
    }
    if (node.type === 'randomizer') {
      const tracks = (node.data?.tracks as string[]) || [];
      if (tracks.length === 0) {
        issues.push({
          id: `randomizer-empty-${node.id}`,
          severity: 'warning',
          message: 'This Sequence / Randomizer has no tracks.',
          nodeId: node.id,
        });
      }
    }
    if (node.type === 'end' || isComment(node) || node.type === 'start') continue;
    if (!isPlaybackNode(node)) continue;
    if (node.type === 'randomizer') continue;
    if (outgoing(edges, node.id).length === 0) {
      issues.push({
        id: `dead-end-${node.id}`,
        severity: 'info',
        message: 'This node has no outgoing connection. Playback stops here.',
        nodeId: node.id,
      });
    }
  }

  return issues;
}

export function validationSummary(issues: GraphIssue[]): {
  errors: number;
  warnings: number;
  infos: number;
  label: string;
} {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  const infos = issues.filter((issue) => issue.severity === 'info').length;
  let label = 'No detected issues';
  if (errors) label = `${errors} error${errors === 1 ? '' : 's'} — playback may fail`;
  else if (warnings) label = `${warnings} warning${warnings === 1 ? '' : 's'}`;
  else if (infos) label = `${infos} note${infos === 1 ? '' : 's'}`;
  return { errors, warnings, infos, label };
}
