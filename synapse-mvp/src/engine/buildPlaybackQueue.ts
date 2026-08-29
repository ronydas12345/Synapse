import type { Node } from '@xyflow/react';
import { createDefaultRng, pickWeightedIndex, type Rng } from './rng';
import type {
  BuildQueueOptions,
  BuildQueueResult,
  GraphSnapshot,
  QueueItem,
} from './types';
import { toQueueKey } from './types';

export const DEFAULT_MAX_QUEUE_ITEMS = 500;
export const DEFAULT_MAX_TRAVERSE_STEPS = 2000;
export const DEFAULT_MAX_PLAY_COUNT = 100;

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

function isBranchingType(type: string | undefined): boolean {
  return type === 'splitter' || type === 'conditional';
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

function clampPlayCount(raw: unknown, maxPlayCount: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), maxPlayCount);
}

/**
 * Walk the Music Path graph from the Start node and produce an ordered
 * playback queue. Pure aside from optional clock/rng inputs — no DOM / YouTube.
 * Never throws; runaway graphs halt via step/queue caps.
 */
export function buildPlaybackQueueResult(
  graph: GraphSnapshot,
  options: BuildQueueOptions = {}
): BuildQueueResult {
  try {
    return walkGraph(graph, options);
  } catch {
    return { items: [], haltReason: 'ok' };
  }
}

function walkGraph(
  graph: GraphSnapshot,
  options: BuildQueueOptions
): BuildQueueResult {
  const { nodes, edges } = graph;
  const rng = options.rng ?? createDefaultRng();
  const currentHour = options.currentHour ?? new Date().getHours();
  const maxQueueItems = options.maxQueueItems ?? DEFAULT_MAX_QUEUE_ITEMS;
  const maxTraverseSteps =
    options.maxTraverseSteps ?? DEFAULT_MAX_TRAVERSE_STEPS;
  const maxPlayCount = options.maxPlayCount ?? DEFAULT_MAX_PLAY_COUNT;

  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) {
    return { items: [], haltReason: 'no_start' };
  }

  const queue: QueueItem[] = [];
  const visited = new Set<string>();
  let steps = 0;
  let haltReason: BuildQueueResult['haltReason'] = 'ok';

  const canPush = (): boolean => {
    if (queue.length >= maxQueueItems) {
      haltReason = 'max_queue';
      return false;
    }
    return haltReason === 'ok';
  };

  const traverse = (nodeId: string) => {
    if (haltReason !== 'ok') return;
    if (!nodeId) return;

    steps += 1;
    if (steps > maxTraverseSteps) {
      haltReason = 'max_steps';
      return;
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    if (node.type === 'track') {
      const playCount = clampPlayCount(node.data?.playCount, maxPlayCount);
      for (let i = 0; i < playCount; i++) {
        if (!canPush()) return;
        queue.push({
          kind: 'track',
          nodeId,
          key: toQueueKey('track', nodeId),
        });
      }
    } else if (node.type === 'randomizer') {
      const mode = (node.data?.mode as string) || 'sequence';
      const tracks = ((node.data?.tracks as string[]) || []).filter(Boolean);
      const isForever = node.data?.isForever as boolean;
      const playCount = isForever
        ? 1
        : clampPlayCount(node.data?.playCount, maxPlayCount);

      if (mode === 'sequence') {
        for (let i = 0; i < playCount; i++) {
          for (const trackId of tracks) {
            if (!canPush()) return;
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
          if (!selected) continue;
          if (!canPush()) return;
          queue.push({
            kind: 'track',
            nodeId: selected,
            key: toQueueKey('track', selected),
          });
        }
      }
    } else if (isBranchingType(node.type)) {
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
      if (outgoingEdge?.target) traverse(outgoingEdge.target);
      return;
    } else if (node.type === 'transition') {
      if (!canPush()) return;
      queue.push({
        kind: 'transition',
        nodeId,
        key: toQueueKey('transition', nodeId),
      });
    }

    if (!isBranchingType(node.type)) {
      for (const edge of edges) {
        if (haltReason !== 'ok') return;
        if (edge.source === nodeId && edge.target) {
          traverse(edge.target);
        }
      }
    }
  };

  traverse(startNode.id);
  return { items: queue, haltReason };
}

export function buildPlaybackQueue(
  graph: GraphSnapshot,
  options: BuildQueueOptions = {}
): QueueItem[] {
  return buildPlaybackQueueResult(graph, options).items;
}

/** Convenience: queue keys for Zustand store compatibility. */
export function buildPlaybackQueueKeys(
  graph: GraphSnapshot,
  options?: BuildQueueOptions
): string[] {
  return buildPlaybackQueue(graph, options).map((item) => item.key);
}
