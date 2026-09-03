/** Track ↔ Sequence move (park hidden nodes) and drop helpers. */

export type FlowRect = { x: number; y: number; width: number; height: number };

export type DroppableNode = {
  id: string;
  type?: string | null;
  position: { x: number; y: number };
  parentId?: string;
  hidden?: boolean;
  width?: number;
  height?: number;
  style?: object;
  measured?: { width?: number; height?: number };
  data?: Record<string, unknown> & {
    tracks?: string[];
    weights?: number[];
    embeddedIn?: string;
  };
};

export type EdgeLike = {
  id?: string;
  source: string;
  target: string;
};

export const SEQUENCE_ITEM_MIME = 'application/x-synapse-sequence-item';

export type SequenceItemPayload = {
  kind: 'sequence-item';
  randomizerId: string;
  trackId: string;
  index: number;
};

const DEFAULT_SIZE: Record<string, { width: number; height: number }> = {
  track: { width: 288, height: 160 },
  randomizer: { width: 224, height: 180 },
};

function asNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function nodeSize(node: DroppableNode): { width: number; height: number } {
  const fallback = DEFAULT_SIZE[node.type ?? ''] ?? { width: 200, height: 150 };
  const style = node.style as { width?: unknown; height?: unknown } | undefined;
  return {
    width: node.measured?.width ?? node.width ?? asNum(style?.width) ?? fallback.width,
    height: node.measured?.height ?? node.height ?? asNum(style?.height) ?? fallback.height,
  };
}

export function overlapArea(a: FlowRect, b: FlowRect): number {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return w * h;
}

export function worldPosition<T extends DroppableNode>(
  node: T,
  byId: Map<string, T>
): { x: number; y: number } {
  let x = node.position?.x || 0;
  let y = node.position?.y || 0;
  let parentId = node.parentId;
  const seen = new Set<string>();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position?.x || 0;
    y += parent.position?.y || 0;
    parentId = parent.parentId;
  }
  return { x, y };
}

export function nodeFlowRect<T extends DroppableNode>(node: T, byId?: Map<string, T>): FlowRect {
  const pos = byId ? worldPosition(node, byId) : { x: node.position.x, y: node.position.y };
  const size = nodeSize(node);
  return { x: pos.x, y: pos.y, width: size.width, height: size.height };
}

export function visibleCanvasNodes<T extends DroppableNode>(nodes: T[]): T[] {
  return nodes.filter((n) => !n.hidden);
}

export function listedTrackIds<T extends DroppableNode>(nodes: T[]): Set<string> {
  const ids = new Set<string>();
  for (const n of nodes) {
    if (n.type !== 'randomizer') continue;
    for (const id of n.data?.tracks ?? []) {
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** Append a track id with default weight 10. Returns null if already present. */
export function addTrackToRandomizerList(
  data: { tracks?: string[]; weights?: number[] } | undefined,
  trackId: string
): { tracks: string[]; weights: number[] } | null {
  if (!trackId) return null;
  const tracks = data?.tracks ?? [];
  if (tracks.includes(trackId)) return null;
  const weights = data?.weights ?? [];
  return { tracks: [...tracks, trackId], weights: [...weights, 10] };
}

export function removeTrackFromRandomizerList(
  data: { tracks?: string[]; weights?: number[] } | undefined,
  trackId: string
): { tracks: string[]; weights: number[] } | null {
  const tracks = data?.tracks ?? [];
  const idx = tracks.indexOf(trackId);
  if (idx < 0) return null;
  const weights = [...(data?.weights ?? [])];
  weights.splice(idx, 1);
  return { tracks: tracks.filter((id) => id !== trackId), weights };
}

export function reorderRandomizerTracks(
  data: { tracks?: string[]; weights?: number[] } | undefined,
  fromIndex: number,
  toIndex: number
): { tracks: string[]; weights: number[] } | null {
  const tracks = [...(data?.tracks ?? [])];
  if (tracks.length === 0) return null;
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= tracks.length ||
    toIndex >= tracks.length
  ) {
    return null;
  }
  const weights = [...(data?.weights ?? [])];
  while (weights.length < tracks.length) weights.push(10);
  const [movedTrack] = tracks.splice(fromIndex, 1);
  const [movedWeight] = weights.splice(fromIndex, 1);
  tracks.splice(toIndex, 0, movedTrack);
  weights.splice(toIndex, 0, movedWeight ?? 10);
  return { tracks, weights };
}

export function stripEdgesForNodeIds<E extends EdgeLike>(
  edges: E[],
  nodeIds: Iterable<string>
): E[] {
  const ids = nodeIds instanceof Set ? nodeIds : new Set(nodeIds);
  if (ids.size === 0) return edges;
  const next = edges.filter((e) => !ids.has(e.source) && !ids.has(e.target));
  return next.length === edges.length ? edges : next;
}

/**
 * Listed track IDs stay in the Zustand nodes array (so playback can resolve
 * them) but are hidden from the React Flow canvas. Graph edges to those
 * tracks are stripped so they cannot play twice.
 */
export function syncParkedTracks<T extends DroppableNode, E extends EdgeLike>(
  nodes: T[],
  edges: E[]
): { nodes: T[]; edges: E[] } {
  const listed = listedTrackIds(nodes);
  let nodesChanged = false;
  const nextNodes = nodes.map((n) => {
    if (n.type !== 'track') return n;
    const shouldHide = listed.has(n.id);
    if (Boolean(n.hidden) === shouldHide) return n;
    nodesChanged = true;
    return { ...n, hidden: shouldHide };
  });
  const hiddenIds = new Set(
    (nodesChanged ? nextNodes : nodes)
      .filter((n) => n.type === 'track' && n.hidden)
      .map((n) => n.id)
  );
  const nextEdges = stripEdgesForNodeIds(edges, hiddenIds);
  if (!nodesChanged && nextEdges === edges) return { nodes, edges };
  return { nodes: nodesChanged ? nextNodes : nodes, edges: nextEdges };
}

export function pickRandomizerDropTarget<T extends DroppableNode>(
  draggedTrack: T,
  nodes: T[]
): T | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const trackRect = nodeFlowRect(draggedTrack, byId);
  let best: T | null = null;
  let bestArea = 0;
  for (const n of nodes) {
    if (n.type !== 'randomizer' || n.id === draggedTrack.id || n.hidden) continue;
    const area = overlapArea(trackRect, nodeFlowRect(n, byId));
    if (area > bestArea) {
      bestArea = area;
      best = n;
    }
  }
  return bestArea > 0 ? best : null;
}

/**
 * Old graphs nested tracks with parentId. Flatten them back onto the canvas
 * while keeping randomizer list membership.
 */
export function flattenEmbeddedTracks<T extends DroppableNode>(nodes: T[]): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let changed = false;
  const next = nodes.map((n) => {
    const nested = n.type === 'track' && (n.parentId || n.data?.embeddedIn);
    if (!nested && !n.parentId) return n;
    if (!nested) return n;
    changed = true;
    const world = worldPosition(n, byId);
    const { parentId: _p, ...rest } = n;
    return {
      ...rest,
      position: world,
      data: { ...(n.data ?? {}), embeddedIn: undefined },
    } as T;
  });
  return changed ? next : nodes;
}

export function normalizeWorkspaceGraph<T extends DroppableNode, E extends EdgeLike>(
  nodes: T[],
  edges: E[]
): { nodes: T[]; edges: E[] } {
  return syncParkedTracks(flattenEmbeddedTracks(nodes), edges);
}

function placeNearRandomizer<T extends DroppableNode>(
  randomizer: T,
  slot: number
): { x: number; y: number } {
  const size = nodeSize(randomizer);
  return {
    x: (randomizer.position?.x ?? 0) + size.width + 24,
    y: (randomizer.position?.y ?? 0) + slot * 48,
  };
}

/**
 * Move a workspace Track into a Sequence/Randomizer: append id, park (hide)
 * the node, strip its graph edges. No-op on invalid/duplicate drops.
 */
export function applyTrackMovesIntoRandomizers<T extends DroppableNode, E extends EdgeLike>(
  nodes: T[],
  edges: E[],
  draggedNodes: T[]
): { nodes: T[]; edges: E[] } | null {
  const droppedTracks = draggedNodes.filter((n) => n.type === 'track');
  if (droppedTracks.length === 0) return null;

  let working: T[] | null = null;
  let changed = false;

  for (const track of droppedTracks) {
    const source: T[] = working ?? nodes;
    const existing = source.find((n) => n.id === track.id);
    if (!existing || existing.type !== 'track') continue;
    const placed: T = {
      ...existing,
      position: track.position ?? existing.position,
      measured: track.measured ?? existing.measured,
      width: track.width ?? existing.width,
      height: track.height ?? existing.height,
    };
    const visible = source.filter((n) => !n.hidden || n.id === placed.id);
    const target = pickRandomizerDropTarget(placed, visible);
    if (!target) continue;

    const added = addTrackToRandomizerList(target.data, track.id);
    const alreadyListed = (target.data?.tracks ?? []).includes(track.id);
    if (!added && alreadyListed && existing.hidden) continue;
    if (!added && !alreadyListed) continue;

    const next: T[] = working ?? source.slice();
    if (added) {
      const idx = next.findIndex((n) => n.id === target.id);
      next[idx] = { ...next[idx], data: { ...next[idx].data, ...added } };
    }
    const trackIdx = next.findIndex((n) => n.id === track.id);
    if (trackIdx >= 0) {
      next[trackIdx] = { ...next[trackIdx], hidden: true, position: placed.position };
    }
    working = next;
    changed = true;
  }

  if (!changed || !working) return null;
  return syncParkedTracks(working, edges);
}

/** @deprecated Use applyTrackMovesIntoRandomizers — kept for nodes-only call sites. */
export function applyTrackDropsOntoRandomizers<T extends DroppableNode>(
  nodes: T[],
  draggedNodes: T[]
): T[] {
  const moved = applyTrackMovesIntoRandomizers(nodes, [], draggedNodes);
  return moved?.nodes ?? nodes;
}

export function restoreTrackFromRandomizer<T extends DroppableNode, E extends EdgeLike>(
  nodes: T[],
  edges: E[],
  randomizerId: string,
  trackId: string,
  dropPosition?: { x: number; y: number }
): { nodes: T[]; edges: E[] } | null {
  if (!trackId || !randomizerId) return null;
  const randomizer = nodes.find((n) => n.id === randomizerId && n.type === 'randomizer');
  if (!randomizer) return null;

  const removed = removeTrackFromRandomizerList(randomizer.data, trackId);
  if (!removed) return null;

  let slot = 0;
  const nextNodes = nodes.map((n) => {
    if (n.id === randomizerId) {
      return { ...n, data: { ...n.data, ...removed } };
    }
    if (n.id !== trackId || n.type !== 'track') return n;
    const position = dropPosition ?? placeNearRandomizer(randomizer, slot);
    slot += 1;
    return { ...n, hidden: false, position };
  });

  return syncParkedTracks(nextNodes, edges);
}

export function restoreTracksFromDeletedRandomizer<T extends DroppableNode, E extends EdgeLike>(
  nodes: T[],
  edges: E[],
  deleted: T
): { nodes: T[]; edges: E[] } {
  const tracks = (deleted.data?.tracks ?? []).filter(Boolean);
  if (tracks.length === 0) return { nodes, edges };
  const stillListed = listedTrackIds(nodes);
  let slot = 0;
  const nextNodes = nodes.map((n) => {
    if (n.type !== 'track' || !tracks.includes(n.id) || stillListed.has(n.id)) return n;
    const position = n.hidden ? placeNearRandomizer(deleted, slot) : n.position;
    if (n.hidden) slot += 1;
    return { ...n, hidden: false, position };
  });
  return syncParkedTracks(nextNodes, edges);
}

export function moveSequenceItemBetweenRandomizers<T extends DroppableNode, E extends EdgeLike>(
  nodes: T[],
  edges: E[],
  sourceRandomizerId: string,
  targetRandomizerId: string,
  trackId: string
): { nodes: T[]; edges: E[] } | null {
  if (!trackId || sourceRandomizerId === targetRandomizerId) return null;
  const source = nodes.find((n) => n.id === sourceRandomizerId && n.type === 'randomizer');
  const target = nodes.find((n) => n.id === targetRandomizerId && n.type === 'randomizer');
  if (!source || !target) return null;

  const removed = removeTrackFromRandomizerList(source.data, trackId);
  if (!removed) return null;
  const added = addTrackToRandomizerList(target.data, trackId);

  const nextNodes = nodes.map((n) => {
    if (n.id === sourceRandomizerId) return { ...n, data: { ...n.data, ...removed } };
    if (n.id === targetRandomizerId && added) return { ...n, data: { ...n.data, ...added } };
    return n;
  });
  return syncParkedTracks(nextNodes, edges);
}

/**
 * After a node is deleted from the workspace: restore tracks that lived in a
 * deleted Sequence, and scrub a deleted Track from remaining sequences.
 */
export function reconcileAfterNodeRemovals<T extends DroppableNode, E extends EdgeLike>(
  remainingNodes: T[],
  remainingEdges: E[],
  removedNodes: T[]
): { nodes: T[]; edges: E[] } {
  let nodes = remainingNodes;
  let edges = remainingEdges;
  for (const removed of removedNodes) {
    if (removed.type === 'randomizer') {
      const restored = restoreTracksFromDeletedRandomizer(nodes, edges, removed);
      nodes = restored.nodes;
      edges = restored.edges;
    } else if (removed.type === 'track') {
      nodes = nodes.map((n) => {
        if (n.type !== 'randomizer') return n;
        const next = removeTrackFromRandomizerList(n.data, removed.id);
        return next ? { ...n, data: { ...n.data, ...next } } : n;
      });
    }
  }
  return syncParkedTracks(nodes, edges);
}

export function parseSequenceItemPayload(raw: string | undefined | null): SequenceItemPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SequenceItemPayload>;
    if (
      parsed?.kind === 'sequence-item' &&
      typeof parsed.randomizerId === 'string' &&
      typeof parsed.trackId === 'string' &&
      typeof parsed.index === 'number'
    ) {
      return parsed as SequenceItemPayload;
    }
  } catch {
    // ignore
  }
  return null;
}

export function sequenceItemFromDataTransfer(dt: DataTransfer | null): SequenceItemPayload | null {
  if (!dt) return null;
  return parseSequenceItemPayload(dt.getData(SEQUENCE_ITEM_MIME));
}

export function dataTransferHasSequenceItem(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  return Array.from(dt.types).includes(SEQUENCE_ITEM_MIME);
}
