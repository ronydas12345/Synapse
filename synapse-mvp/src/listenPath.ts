import type { Edge, Node } from '@xyflow/react';
import { parseQueueKey } from './engine/types';
import { getTrackDisplayMeta } from './trackMetadata';

export type ListenPhase = 'played' | 'now' | 'upcoming';
export type ListenRowKind = 'item' | 'split';

export interface ListenBranchOption {
  nodeId: string;
  label: string;
  detail: string;
  chosen: boolean;
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
  /** True when the playhead is on this split's current arm. */
  inside?: boolean;
  /** First node after this split's remaining branch content. */
  leaveTargetId?: string | null;
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

/** Randomizer that lists this track, or conditional that edges into it. */
export function findSplitOwner(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): Node | undefined {
  const owner = nodes.find(
    (n) =>
      n.type === 'randomizer' &&
      ((n.data?.tracks as string[]) || []).includes(nodeId)
  );
  if (owner) return owner;
  const incoming = edges.find((e) => e.target === nodeId && !String(e.id).startsWith('dashed-'));
  if (!incoming) return undefined;
  const src = nodes.find((n) => n.id === incoming.source);
  if (src?.type === 'conditional' || src?.type === 'splitter') return src;
  return undefined;
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

/** Nodes that still count as this split's current arm (skip these when leaving). */
export function branchMemberIds(
  splitNode: Node,
  chosenId: string | undefined,
  nodes: Node[],
  edges: Edge[]
): Set<string> {
  if (splitNode.type === 'randomizer') {
    return new Set(((splitNode.data?.tracks as string[]) || []).filter(Boolean));
  }
  if (
    (splitNode.type === 'conditional' || splitNode.type === 'splitter') &&
    chosenId
  ) {
    const split = branchesFromNode(splitNode, nodes, edges);
    const others = (split?.options || [])
      .map((o) => o.nodeId)
      .filter((id) => id !== chosenId);
    const reals = realEdges(edges);
    const otherReach = new Set<string>();
    for (const other of others) {
      for (const id of reachableFrom(other, reals, new Set([splitNode.id]))) {
        otherReach.add(id);
      }
    }
    const members = new Set<string>();
    const stack = [chosenId];
    while (stack.length) {
      const id = stack.pop();
      if (!id || members.has(id) || id === splitNode.id) continue;
      if (id !== chosenId && otherReach.has(id)) continue;
      members.add(id);
      for (const edge of reals) {
        if (edge.source === id && edge.target) stack.push(edge.target);
      }
    }
    return members;
  }
  return new Set();
}

export function resolveLeaveBranchTarget(args: {
  splitNode: Node;
  members: Set<string>;
  parsed: Array<{ nodeId: string }>;
  currentIndex: number;
  edges: Edge[];
}): string | null {
  const { splitNode, members, parsed, currentIndex, edges } = args;
  if (currentIndex >= 0) {
    for (let i = currentIndex + 1; i < parsed.length; i++) {
      if (!members.has(parsed[i].nodeId)) return parsed[i].nodeId;
    }
  }

  const reals = realEdges(edges);
  if (splitNode.type === 'randomizer') {
    const out = reals.find(
      (e) =>
        e.source === splitNode.id && Boolean(e.target) && !members.has(e.target)
    );
    return out?.target ?? null;
  }

  const currentId = currentIndex >= 0 ? parsed[currentIndex]?.nodeId : undefined;
  if (!currentId) return null;
  const seen = new Set<string>([currentId]);
  const queue = [currentId];
  while (queue.length) {
    const id = queue.shift();
    if (!id) continue;
    for (const edge of reals) {
      if (edge.source !== id || !edge.target || edge.target === splitNode.id) {
        continue;
      }
      if (!members.has(edge.target)) return edge.target;
      if (!seen.has(edge.target)) {
        seen.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  return null;
}

function chosenOptionId(
  owner: Node,
  split: { options: ListenBranchOption[] },
  remainingIds: string[],
  playheadId: string | undefined,
  nodes: Node[],
  edges: Edge[]
): string | undefined {
  if (playheadId && split.options.some((o) => o.nodeId === playheadId)) {
    return playheadId;
  }
  if (playheadId) {
    for (const option of split.options) {
      const members = branchMemberIds(owner, option.nodeId, nodes, edges);
      if (members.has(playheadId)) return option.nodeId;
    }
  }
  return remainingIds.find((id) =>
    split.options.some((o) => o.nodeId === id)
  );
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
  };
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
    });
  }

  const emitSplit = (
    itemNodeId: string,
    remainingIds: string[],
    phase: ListenPhase
  ) => {
    const owner = findSplitOwner(itemNodeId, nodes, edges);
    if (!owner || shownSplits.has(owner.id)) return;
    const split = branchesFromNode(owner, nodes, edges);
    if (!split) return;
    shownSplits.add(owner.id);
    const playheadId =
      currentIndex >= 0 ? parsed[currentIndex]?.nodeId : undefined;
    const chosenId = chosenOptionId(
      owner,
      split,
      remainingIds,
      playheadId,
      nodes,
      edges
    );
    const members = branchMemberIds(owner, chosenId, nodes, edges);
    const inside = Boolean(playheadId && members.has(playheadId));
    rows.push({
      kind: 'split',
      phase,
      nodeId: owner.id,
      title: split.title,
      subtitle: split.modeLabel,
      type: owner.type || 'split',
      modeLabel: split.modeLabel,
      inside,
      leaveTargetId: inside
        ? resolveLeaveBranchTarget({
            splitNode: owner,
            members,
            parsed,
            currentIndex,
            edges,
          })
        : null,
      options: split.options.map((o) => ({
        ...o,
        chosen: chosenId ? o.nodeId === chosenId : false,
      })),
    });
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

  return rows;
}
