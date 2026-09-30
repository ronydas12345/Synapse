import type { Edge, Node } from '@xyflow/react';

export type ConditionalKind = 'random' | 'timeRange' | 'weather' | 'day';

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  if (!a || !b) return a || b || 1;
  return Math.abs((a / gcd(a, b)) * b);
}

function isConditionalNode(node: Node | undefined): boolean {
  return node?.type === 'conditional' || node?.type === 'splitter';
}

export function conditionalKind(node: Node | undefined): ConditionalKind | null {
  if (!isConditionalNode(node)) return null;
  const mode = node?.data?.mode;
  if (mode === 'timeRange' || mode === 'weather' || mode === 'day') return mode;
  return 'random';
}

export function isWeightedRandomConditional(node: Node | undefined): boolean {
  return conditionalKind(node) === 'random';
}

function handlePathIndex(handle: string | null | undefined, fallback: number): number {
  if (typeof handle === 'string' && handle.length === 1) {
    const index = handle.charCodeAt(0) - 65;
    if (index >= 0 && index < 26) return index;
  }
  return fallback;
}

function pathWeight(weights: unknown, index: number): number {
  const list = Array.isArray(weights) ? weights : [];
  const value = list[index];
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  return 10;
}

function outgoing(edges: Edge[], sourceId: string): Edge[] {
  return edges
    .filter((edge) => edge.source === sourceId)
    .map((edge, order) => ({ edge, order, index: handlePathIndex(edge.sourceHandle, order) }))
    .sort((a, b) => a.index - b.index || a.order - b.order)
    .map((item) => item.edge);
}

type FlatPath = { target: string; num: number; den: number };

function scaleIntegerWeights(paths: FlatPath[]): number[] {
  const common = paths.reduce((acc, path) => lcm(acc, path.den || 1), 1);
  const ints = paths.map((path) => Math.round((path.num * common) / (path.den || 1)));
  const divisor = ints.reduce((acc, value) => gcd(acc, value), ints[0] ?? 1);
  return ints.map((value) => value / divisor);
}

function flattenRandomChild(
  parentWeight: number,
  child: Node,
  edges: Edge[]
): FlatPath[] | null {
  if (!isWeightedRandomConditional(child)) return null;
  const childEdges = outgoing(edges, child.id);
  if (childEdges.length === 0) return [];
  const childWeights = childEdges.map((edge, order) =>
    pathWeight(child.data?.weights, handlePathIndex(edge.sourceHandle, order))
  );
  const childTotal = childWeights.reduce((sum, weight) => sum + weight, 0) || 1;
  return childEdges.map((edge, i) => ({
    target: edge.target,
    num: parentWeight * childWeights[i],
    den: childTotal,
  }));
}

/**
 * Flatten nested weighted-random conditionals into the parent, multiplying
 * path weights. Weather, time-range, and day conditionals are left intact.
 */
export function normalizeStackedConditionals(
  nodesIn: Node[],
  edgesIn: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  let nodes = nodesIn.map((node) => ({ ...node, data: { ...(node.data || {}) } }));
  let edges = edgesIn.map((edge) => ({ ...edge }));
  let changed = false;

  let progress = true;
  while (progress) {
    progress = false;
    const byId = new Map(nodes.map((node) => [node.id, node]));

    for (const parent of nodes) {
      if (!isWeightedRandomConditional(parent)) continue;
      const children = outgoing(edges, parent.id);
      const flattenable = children.filter((edge) =>
        isWeightedRandomConditional(byId.get(edge.target))
      );
      if (flattenable.length === 0) continue;

      const flat: FlatPath[] = [];
      const removeNodeIds = new Set<string>();
      const removeEdgeIds = new Set<string>();

      children.forEach((edge, order) => {
        const parentWeight = pathWeight(
          parent.data?.weights,
          handlePathIndex(edge.sourceHandle, order)
        );
        const child = byId.get(edge.target);
        const nested = child ? flattenRandomChild(parentWeight, child, edges) : null;
        if (nested) {
          removeNodeIds.add(child.id);
          removeEdgeIds.add(edge.id);
          for (const childEdge of outgoing(edges, child.id)) {
            removeEdgeIds.add(childEdge.id);
          }
          flat.push(...nested);
          return;
        }
        if (edge.target) {
          flat.push({ target: edge.target, num: parentWeight, den: 1 });
        }
      });

      if (removeNodeIds.size === 0 || flat.length === 0) continue;

      const weights = scaleIntegerWeights(flat);
      const nextParent: Node = {
        ...parent,
        data: {
          ...parent.data,
          mode: 'random',
          numPaths: flat.length,
          weights,
        },
      };

      nodes = nodes
        .filter((node) => !removeNodeIds.has(node.id))
        .map((node) => (node.id === parent.id ? nextParent : node));
      edges = [
        ...edges.filter(
          (edge) => !removeEdgeIds.has(edge.id) && edge.source !== parent.id
        ),
        ...flat.map((path, i) => ({
          id: `${parent.id}-${path.target}-${i}`,
          source: parent.id,
          sourceHandle: String.fromCharCode(65 + i),
          target: path.target,
          markerEnd: { type: 'arrowclosed' as const },
        })),
      ];
      changed = true;
      progress = true;
      break;
    }
  }

  if (!changed) return { nodes: nodesIn, edges: edgesIn };
  return { nodes, edges };
}
