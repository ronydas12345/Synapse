import type { Node } from '@xyflow/react';
import { createDefaultRng, pickWeightedIndex, type Rng } from './rng';
import type { BuildQueueOptions, GraphSnapshot, QueueItem } from './types';
import { toQueueKey } from './types';

function isHourInRanges(
  hour: number,
  ranges: Array<{ start: number; end: number }>
): boolean {
  return ranges.some((range) => {
    if (range.start <= range.end) {
      return hour >= range.start && hour <= range.end;
    }
    return hour >= range.start || hour <= range.end;
  });
}

function selectFromRandomizer(
  randomizerNode: Node,
  rng: Rng
): string | null {
  const tracks = (randomizerNode.data?.tracks as string[]) || [];
  if (tracks.length === 0) return null;

  const weights =
    (randomizerNode.data?.weights as number[]) ||
    Array(tracks.length).fill(100 / tracks.length);

  const index = pickWeightedIndex(weights, rng);
  return tracks[index] ?? tracks[tracks.length - 1] ?? null;
}

/**
 * Walk the Music Path graph from the Start node and produce an ordered
 * playback queue. Pure aside from optional clock/rng inputs — no DOM / YouTube.
 */
export function buildPlaybackQueue(
  graph: GraphSnapshot,
  options: BuildQueueOptions = {}
): QueueItem[] {
  const { nodes, edges } = graph;
  const rng = options.rng ?? createDefaultRng();
  const currentHour = options.currentHour ?? new Date().getHours();

  const queue: QueueItem[] = [];
  const visited = new Set<string>();

  const traverse = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const isSplitter = node.type === 'splitter';
    if (!isSplitter && visited.has(nodeId)) return;
    if (!isSplitter) visited.add(nodeId);

    if (node.type === 'track') {
      const playCount = Math.max(1, (node.data?.playCount as number) || 1);
      for (let i = 0; i < playCount; i++) {
        queue.push({
          kind: 'track',
          nodeId,
          key: toQueueKey('track', nodeId),
        });
      }
    } else if (node.type === 'randomizer') {
      const mode = (node.data?.mode as string) || 'sequence';
      const tracks = (node.data?.tracks as string[]) || [];
      let playCount = (node.data?.playCount as number) || 1;
      const isForever = node.data?.isForever as boolean;

      if (isForever) playCount = 1;
      playCount = Math.min(playCount, 100);

      if (mode === 'sequence') {
        for (let i = 0; i < playCount; i++) {
          for (const trackId of tracks) {
            queue.push({
              kind: 'track',
              nodeId: trackId,
              key: toQueueKey('track', trackId),
            });
          }
        }
      } else {
        for (let i = 0; i < playCount; i++) {
          const selected = selectFromRandomizer(node, rng);
          if (selected) {
            queue.push({
              kind: 'track',
              nodeId: selected,
              key: toQueueKey('track', selected),
            });
          }
        }
      }
    } else if (node.type === 'splitter' || node.type === 'conditional') {
      const mode = (node.data?.mode as string) || 'random';
      const weights = (node.data?.weights as number[]) || [1, 1];
      const pathTimeRanges =
        (node.data?.pathTimeRanges as Array<
          Array<{ start: number; end: number }>
        >) ||
        Array(weights.length)
          .fill(null)
          .map(() => [{ start: 0, end: 23 }]);

      let selectedPathIndex = -1;

      if (mode === 'timeRange') {
        for (let i = 0; i < pathTimeRanges.length; i++) {
          if (isHourInRanges(currentHour, pathTimeRanges[i] || [])) {
            selectedPathIndex = i;
            break;
          }
        }
        if (selectedPathIndex === -1) selectedPathIndex = 0;
      } else {
        selectedPathIndex = pickWeightedIndex(weights, rng);
      }

      const pathId = String.fromCharCode(65 + selectedPathIndex);
      const outgoingEdge = edges.find(
        (e) => e.source === nodeId && e.sourceHandle === pathId
      );
      if (outgoingEdge) traverse(outgoingEdge.target);
    } else if (node.type === 'transition') {
      queue.push({
        kind: 'transition',
        nodeId,
        key: toQueueKey('transition', nodeId),
      });
    }

    if (node.type !== 'splitter' && node.type !== 'conditional') {
      for (const edge of edges) {
        if (edge.source === nodeId) traverse(edge.target);
      }
    }
  };

  const startNode = nodes.find((n) => n.type === 'start');
  if (startNode) traverse(startNode.id);

  return queue;
}

/** Convenience: queue keys for Zustand store compatibility. */
export function buildPlaybackQueueKeys(
  graph: GraphSnapshot,
  options?: BuildQueueOptions
): string[] {
  return buildPlaybackQueue(graph, options).map((item) => item.key);
}
