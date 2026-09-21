import type { Edge, Node } from '@xyflow/react';

export const NODE_CLIPBOARD_TYPE = 'synapse-nodes';
export const NODE_CLIPBOARD_VERSION = 1;
export const PASTE_OFFSET = { x: 48, y: 48 };

export interface NodeClipboard {
  type: typeof NODE_CLIPBOARD_TYPE;
  schemaVersion: typeof NODE_CLIPBOARD_VERSION;
  nodes: Node[];
  edges: Edge[];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asIdList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}

export function parseNodeClipboard(raw: string): NodeClipboard | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Partial<NodeClipboard>;
    if (value.type !== NODE_CLIPBOARD_TYPE) return null;
    if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) return null;
    return {
      type: NODE_CLIPBOARD_TYPE,
      schemaVersion: NODE_CLIPBOARD_VERSION,
      nodes: value.nodes as Node[],
      edges: value.edges as Edge[],
    };
  } catch {
    return null;
  }
}

export function collectCopySet(
  nodes: Node[],
  edges: Edge[],
  selectedIds: string[]
): NodeClipboard | null {
  const selected = new Set(selectedIds.filter(Boolean));
  if (!selected.size) return null;

  const extra = new Set<string>();
  for (const node of nodes) {
    if (!selected.has(node.id)) continue;
    for (const trackId of asIdList(node.data?.tracks)) extra.add(trackId);
    const linked = node.data?.linkedNodeId;
    if (typeof linked === 'string' && linked) extra.add(linked);
  }

  const keep = new Set([...selected, ...extra]);
  const copiedNodes = nodes
    .filter((node) => keep.has(node.id))
    .map((node) => ({
      id: node.id,
      type: node.type,
      position: { ...node.position },
      data: cloneJson(node.data ?? {}),
      hidden: Boolean(node.hidden),
    })) as Node[];
  if (!copiedNodes.length) return null;

  const copiedEdges = edges
    .filter(
      (edge) =>
        !edge.id.startsWith('dashed-') && keep.has(edge.source) && keep.has(edge.target)
    )
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      markerEnd: edge.markerEnd,
    })) as Edge[];

  return {
    type: NODE_CLIPBOARD_TYPE,
    schemaVersion: NODE_CLIPBOARD_VERSION,
    nodes: copiedNodes,
    edges: copiedEdges,
  };
}

function remapDataIds(data: Record<string, unknown>, idMap: Map<string, string>) {
  const tracks = asIdList(data.tracks).map((id) => idMap.get(id) ?? id);
  if (Array.isArray(data.tracks)) data.tracks = tracks;
  if (typeof data.linkedNodeId === 'string' && idMap.has(data.linkedNodeId)) {
    data.linkedNodeId = idMap.get(data.linkedNodeId);
  }
}

export function applyPaste(
  nodes: Node[],
  edges: Edge[],
  clipboard: NodeClipboard,
  offset = PASTE_OFFSET,
  now = Date.now()
): { nodes: Node[]; edges: Edge[]; selectedIds: string[] } {
  const idMap = new Map<string, string>();
  clipboard.nodes.forEach((node, index) => {
    const kind = node.type || 'node';
    idMap.set(node.id, `${kind}-${now}-${index}`);
  });

  const pastedNodes: Node[] = clipboard.nodes.map((node) => {
    const data = cloneJson((node.data ?? {}) as Record<string, unknown>);
    remapDataIds(data, idMap);
    return {
      ...node,
      id: idMap.get(node.id)!,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      data,
      selected: true,
    };
  });

  const pastedEdges: Edge[] = clipboard.edges.map((edge, index) => ({
    ...edge,
    id: `${idMap.get(edge.source)}-${idMap.get(edge.target)}-${now}-${index}`,
    source: idMap.get(edge.source)!,
    target: idMap.get(edge.target)!,
    selected: false,
  }));

  const cleared = nodes.map((node) => ({ ...node, selected: false }));
  return {
    nodes: [...cleared, ...pastedNodes],
    edges: [...edges, ...pastedEdges],
    selectedIds: pastedNodes.map((node) => node.id),
  };
}
