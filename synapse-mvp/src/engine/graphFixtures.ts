import type { Edge, Node } from '@xyflow/react';
import type { GraphSnapshot } from './types';

export function makeNode(
  id: string,
  type: string,
  data: Record<string, unknown> = {}
): Node {
  return { id, type, position: { x: 0, y: 0 }, data };
}

export function makeEdge(
  source: string,
  target: string,
  sourceHandle?: string
): Edge {
  return {
    id: `${source}:${sourceHandle ?? 'out'}->${target}`,
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {}),
  };
}

export function graph(nodes: Node[], edges: Edge[]): GraphSnapshot {
  return { nodes, edges };
}
