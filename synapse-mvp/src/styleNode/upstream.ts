import type { Edge, Node } from '@xyflow/react';

const MAX_STEPS = 2000;

function realEdges(edges: Edge[]): Edge[] {
  return edges.filter((e) => !String(e.id).startsWith('dashed-'));
}

function previousOnPath(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  seen: Set<string>
): string | null {
  const incoming = realEdges(edges)
    .filter((e) => e.target === nodeId && e.source && !seen.has(e.source))
    .map((e) => e.source);
  if (incoming[0]) return incoming[0];
  const owner = nodes.find(
    (n) =>
      n.type === 'randomizer' &&
      !seen.has(n.id) &&
      ((n.data?.tracks as string[]) || []).includes(nodeId)
  );
  return owner?.id ?? null;
}

/**
 * Style nodes on the path from Start to `originId`, excluding origin itself.
 * Used when playback jumps to a node so earlier Style cues still apply.
 */
export function collectUpstreamStyleNodes(
  nodes: Node[],
  edges: Edge[],
  originId: string
): Node[] {
  if (!originId) return [];
  const styles: Node[] = [];
  const seen = new Set<string>([originId]);
  let current = originId;
  for (let step = 0; step < MAX_STEPS; step++) {
    const prev = previousOnPath(current, nodes, edges, seen);
    if (!prev) break;
    seen.add(prev);
    current = prev;
    const node = nodes.find((n) => n.id === current);
    if (!node) break;
    if (node.type === 'style') styles.push(node);
    if (node.type === 'start') break;
  }
  return styles.reverse();
}
