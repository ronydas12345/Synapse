import type { Node, Edge } from '@xyflow/react';

export type QueueItemKind = 'track' | 'transition';

export interface QueueItem {
  kind: QueueItemKind;
  nodeId: string;
  /** Serialized form used by the store / UI: `track:id` | `transition:id` */
  key: string;
}

export type BuildQueueHaltReason =
  | 'ok'
  | 'no_start'
  | 'max_steps'
  | 'max_queue';

export interface BuildQueueOptions {
  /** Optional seeded RNG for deterministic weighted picks. */
  rng?: () => number;
  /** Hour 0–23 for time-range conditionals; defaults to local now. */
  currentHour?: number;
  /** Hard cap on queued items. Defaults to DEFAULT_MAX_QUEUE_ITEMS. */
  maxQueueItems?: number;
  /** Hard cap on traverse calls. Defaults to DEFAULT_MAX_TRAVERSE_STEPS. */
  maxTraverseSteps?: number;
  /** Cap for per-node playCount. Defaults to DEFAULT_MAX_PLAY_COUNT. */
  maxPlayCount?: number;
  /**
   * Walk from this node instead of the graph Start node.
   * Invalid types (e.g. comment) yield an empty queue.
   * Missing ids fall back to Start.
   */
  startNodeId?: string;
}

export interface BuildQueueResult {
  items: QueueItem[];
  haltReason: BuildQueueHaltReason;
}

export interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export function parseQueueKey(key: string): QueueItem | null {
  const idx = key.indexOf(':');
  if (idx <= 0) return null;
  const kind = key.slice(0, idx) as QueueItemKind;
  const nodeId = key.slice(idx + 1);
  if ((kind !== 'track' && kind !== 'transition') || !nodeId) return null;
  return { kind, nodeId, key };
}

export function toQueueKey(kind: QueueItemKind, nodeId: string): string {
  return `${kind}:${nodeId}`;
}
