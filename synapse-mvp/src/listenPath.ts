import type { Edge, Node } from '@xyflow/react';
import { parseQueueKey } from './engine/types';
import { getTrackDisplayMeta } from './trackMetadata';

export type ListenPhase = 'played' | 'now' | 'upcoming';
export type ListenRowKind = 'item' | 'split';

export interface ListenPathItem {
  nodeId: string;
  title: string;
  subtitle: string;
}

export interface ListenBranchOption {
  nodeId: string;
  label: string;
  detail: string;
  chosen: boolean;
  items?: ListenPathItem[];
}

export interface ListenRow {
  kind: ListenRowKind;
  phase: ListenPhase;
  nodeId: string;
  title: string;
  subtitle: string;
  type: string;
  modeLabel?: string;
  options?: ListenBranchOption[];
  /** Playhead is still on an arm of this split. */
  inside?: boolean;
  /** Nesting level, like a code indent (Start is 0). */
  depth: number;
}

export function weightPercents(weights: number[]): number[] {
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const even = Math.round(100 / Math.max(safe.length, 1));
    return safe.map(() => even);
  }
  return safe.map((w) => Math.round((w / sum) * 100));
}

export function nodeListLabel(node: Node | undefined): { title: string; subtitle: string } {
  if (!node) return { title: 'Missing node', subtitle: '' };
  if (node.type === 'track') {
    const meta = getTrackDisplayMeta(node.data);
    return { title: meta.title, subtitle: meta.artist };
  }
  if (node.type === 'transition') {
    return {
      title: 'Transition',
      subtitle: String(node.data?.type || 'silence'),
    };
  }
  if (node.type === 'randomizer') {
    const mode = node.data?.mode === 'randomizer' ? 'Weighted Random' : 'Sequence';
    return { title: mode, subtitle: 'Sequence / Randomizer' };
  }
  if (node.type === 'conditional' || node.type === 'splitter') {
    const mode = node.data?.mode === 'timeRange' ? 'Time Range' : 'Weighted Random';
    return { title: 'Conditional', subtitle: mode };
  }
  if (node.type === 'start') return { title: 'Start', subtitle: '' };
  if (node.type === 'end') return { title: 'End', subtitle: '' };
  return { title: String(node.data?.label || node.type || node.id), subtitle: '' };
}

function pathLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function formatHour(hour: number): string {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  return `${String(h).padStart(2, '0')}:00`;
}

export function branchesFromNode(
  node: Node,
  nodes: Node[],
  edges: Edge[]
): { title: string; modeLabel: string; options: ListenBranchOption[] } | null {
  if (node.type === 'randomizer') {
    const tracks = ((node.data?.tracks as string[]) || []).filter(Boolean);
    if (tracks.length === 0) return null;
    const mode = node.data?.mode === 'randomizer' ? 'randomizer' : 'sequence';
    const weights =
      (node.data?.weights as number[]) || tracks.map(() => 10);
    const pcts = weightPercents(tracks.map((_, i) => weights[i] ?? 10));
    const options = tracks.map((id, i) => {
      const track = nodes.find((n) => n.id === id);
      const label = nodeListLabel(track);
      return {
        nodeId: id,
        label: label.title,
        detail: mode === 'sequence' ? `${i + 1}` : `${pcts[i]}%`,
        chosen: false,
      };
    });
    return {
      title: nodeListLabel(node).title,
      modeLabel: mode === 'sequence' ? 'Sequence' : 'Weighted Random',
      options,
    };
  }

  if (node.type === 'conditional' || node.type === 'splitter') {
    const mode = (node.data?.mode as string) || 'random';
    const weights = (node.data?.weights as number[]) || [1, 1];
    const pathTimeRanges =
      (node.data?.pathTimeRanges as Array<Array<{ start: number; end: number }>>) ||
      [];
    const numPaths = Math.max(
      weights.length,
      pathTimeRanges.length,
      edges.filter((e) => e.source === node.id).length,
      2
    );
    const pcts = weightPercents(
      Array.from({ length: numPaths }, (_, i) => weights[i] ?? 1)
    );
    const options: ListenBranchOption[] = [];
    for (let i = 0; i < numPaths; i++) {
      const handle = pathLetter(i);
      const edge = edges.find(
        (e) => e.source === node.id && (e.sourceHandle === handle || (!e.sourceHandle && i === 0))
      );
      if (!edge?.target) continue;
      const target = nodes.find((n) => n.id === edge.target);
      const label = nodeListLabel(target);
      let detail = `${pcts[i]}%`;
      if (mode === 'timeRange') {
        const ranges = pathTimeRanges[i] || [];
        if (ranges[0]) {
          detail = `${formatHour(ranges[0].start)}–${formatHour(ranges[0].end)}`;
        }
      }
      options.push({
        nodeId: edge.target,
        label: `${handle} · ${label.title}`,
        detail,
        chosen: false,
      });
    }
    if (options.length === 0) return null;
    return {
      title: 'Conditional',
      modeLabel: mode === 'timeRange' ? 'Time Range' : 'Weighted Random',
      options,
    };
  }

  return null;
}

function realEdges(edges: Edge[]): Edge[] {
  return edges.filter((e) => !String(e.id).startsWith('dashed-'));
}

function reachableFrom(
  startId: string,
  edges: Edge[],
  stopIds: Set<string>
): Set<string> {
  const out = new Set<string>();
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop();
    if (!id || out.has(id) || stopIds.has(id)) continue;
    out.add(id);
    for (const edge of edges) {
      if (edge.source === id && edge.target) stack.push(edge.target);
    }
  }
  return out;
}

/** Songs on this arm until a merge with another arm. */
export function collectArmItems(
  startId: string,
  otherStarts: string[],
  splitId: string,
  nodes: Node[],
  edges: Edge[]
): ListenPathItem[] {
  const reals = realEdges(edges);
  const otherReach = new Set<string>();
  for (const other of otherStarts) {
    for (const id of reachableFrom(other, reals, new Set([splitId]))) {
      otherReach.add(id);
    }
  }
  const items: ListenPathItem[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (!id || seen.has(id) || id === splitId) return;
    if (id !== startId && otherReach.has(id)) return;
    seen.add(id);
    const node = nodes.find((n) => n.id === id);
    const label = nodeListLabel(node);
    items.push({ nodeId: id, title: label.title, subtitle: label.subtitle });
    if (node?.type === 'randomizer') {
      for (const trackId of ((node.data?.tracks as string[]) || []).filter(Boolean)) {
        if (seen.has(trackId)) continue;
        seen.add(trackId);
        const track = nodes.find((n) => n.id === trackId);
        const trackLabel = nodeListLabel(track);
        items.push({
          nodeId: trackId,
          title: trackLabel.title,
          subtitle: trackLabel.subtitle,
        });
      }
    }
    for (const edge of reals) {
      if (edge.source === id && edge.target) visit(edge.target);
    }
  };
  visit(startId);
  return items;
}

function nearestConditional(
  fromId: string,
  nodes: Node[],
  edges: Edge[]
): Node | undefined {
  const seen = new Set<string>();
  let current: string | undefined = fromId;
  while (current && !seen.has(current)) {
    seen.add(current);
    const incoming = realEdges(edges).find((e) => e.target === current);
    if (!incoming) return undefined;
    const src = nodes.find((n) => n.id === incoming.source);
    if (!src) return undefined;
    if (src.type === 'conditional' || src.type === 'splitter') return src;
    if (src.type === 'start') return undefined;
    current = src.id;
  }
  return undefined;
}

/** Conditional/splitter and/or randomizer that owns this queue node. */
export function findSplitOwners(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  const owners: Node[] = [];
  const push = (node: Node | undefined) => {
    if (node && !owners.some((o) => o.id === node.id)) owners.push(node);
  };
  const randomizer = nodes.find(
    (n) =>
      n.type === 'randomizer' &&
      ((n.data?.tracks as string[]) || []).includes(nodeId)
  );
  push(nearestConditional(nodeId, nodes, edges));
  if (randomizer) {
    push(nearestConditional(randomizer.id, nodes, edges));
    push(randomizer);
  }
  return owners;
}

/** Randomizer that lists this track, or nearest conditional that reaches it. */
export function findSplitOwner(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): Node | undefined {
  return findSplitOwners(nodeId, nodes, edges)[0];
}

function describeItem(
  phase: ListenPhase,
  nodeId: string,
  node: Node | undefined,
  itemKind: string
): ListenRow {
  const label = nodeListLabel(node);
  return {
    kind: 'item',
    phase,
    nodeId,
    title: label.title,
    subtitle: label.subtitle,
    type: node?.type || itemKind,
    depth: 0,
  };
}

function rowBelongsToFrame(row: ListenRow, ids: Set<string>): boolean {
  if (ids.has(row.nodeId)) return true;
  if (row.kind !== 'split') return false;
  return (row.options || []).some(
    (option) =>
      ids.has(option.nodeId) ||
      (option.items || []).some((item) => ids.has(item.nodeId))
  );
}

export function assignListenDepths(rows: ListenRow[]): ListenRow[] {
  const stack: Array<{ ids: Set<string>; depth: number }> = [];
  return rows.map((row) => {
    if (row.type === 'start') {
      return { ...row, depth: 0 };
    }
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (rowBelongsToFrame(row, top.ids)) break;
      stack.pop();
    }
    const depth = stack.length === 0 ? 1 : stack[stack.length - 1].depth + 1;
    if (row.kind === 'split') {
      const ids = new Set<string>();
      for (const option of row.options || []) {
        if (option.nodeId) ids.add(option.nodeId);
        for (const item of option.items || []) ids.add(item.nodeId);
      }
      stack.push({ ids, depth });
    }
    return { ...row, depth };
  });
}

export function buildListenRows(args: {
  nodes: Node[];
  edges: Edge[];
  queue: string[];
  currentIndex: number;
}): ListenRow[] {
  const { nodes, edges, queue, currentIndex } = args;
  const parsed = queue
    .map((key) => parseQueueKey(key))
    .filter((item): item is NonNullable<typeof item> => item != null);

  const rows: ListenRow[] = [];
  const shownSplits = new Set<string>();
  const startNode = nodes.find((n) => n.type === 'start');
  if (startNode) {
    rows.push({
      kind: 'item',
      phase: currentIndex >= 0 ? 'played' : 'upcoming',
      nodeId: startNode.id,
      title: 'Start',
      subtitle: 'Play from beginning',
      type: 'start',
      depth: 0,
    });
  }

  const emitSplit = (
    itemNodeId: string,
    remainingIds: string[],
    phase: ListenPhase
  ) => {
    const playheadId =
      currentIndex >= 0 ? parsed[currentIndex]?.nodeId : undefined;
    for (const owner of findSplitOwners(itemNodeId, nodes, edges)) {
      if (shownSplits.has(owner.id)) continue;
      const split = branchesFromNode(owner, nodes, edges);
      if (!split) continue;
      shownSplits.add(owner.id);
      const options = split.options.map((option) => {
        const others = split.options
          .map((o) => o.nodeId)
          .filter((id) => id !== option.nodeId);
        return {
          ...option,
          items: collectArmItems(option.nodeId, others, owner.id, nodes, edges),
        };
      });
      const chosenId =
        (playheadId &&
          options.find(
            (o) =>
              o.nodeId === playheadId ||
              o.items.some((item) => item.nodeId === playheadId)
          )?.nodeId) ||
        remainingIds.find((id) =>
          options.some(
            (o) => o.nodeId === id || o.items.some((item) => item.nodeId === id)
          )
        );
      const armIds = new Set(
        options.flatMap((o) => o.items.map((item) => item.nodeId))
      );
      rows.push({
        kind: 'split',
        phase,
        nodeId: owner.id,
        title: split.title,
        subtitle: split.modeLabel,
        type: owner.type || 'split',
        modeLabel: split.modeLabel,
        inside: Boolean(playheadId && armIds.has(playheadId)),
        options: options.map((o) => ({
          ...o,
          chosen: chosenId ? o.nodeId === chosenId : false,
        })),
        depth: 0,
      });
    }
  };

  const emitItem = (index: number, phase: ListenPhase) => {
    const item = parsed[index];
    if (!item) return;
    const node = nodes.find((n) => n.id === item.nodeId);
    const remainingIds = parsed.slice(index).map((p) => p.nodeId);
    emitSplit(item.nodeId, remainingIds, phase);
    rows.push(describeItem(phase, item.nodeId, node, item.kind));
  };

  if (currentIndex >= 0) {
    for (let i = 0; i < currentIndex; i++) emitItem(i, 'played');
    emitItem(currentIndex, 'now');
    for (let i = currentIndex + 1; i < parsed.length; i++) emitItem(i, 'upcoming');
  } else {
    for (let i = 0; i < parsed.length; i++) emitItem(i, 'upcoming');
  }

  return assignListenDepths(rows);
}
