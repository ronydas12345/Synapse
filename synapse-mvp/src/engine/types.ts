import type { Node, Edge } from '@xyflow/react';

export type QueueItemKind = 'track' | 'transition';

export interface QueueItem {
  kind: QueueItemKind;
  nodeId: string;
  /** Serialized form used by the store / UI: `track:id` | `transition:id` */
  key: string;
}

export interface BuildQueueOptions {
  /** Optional seeded RNG for deterministic weighted picks. */
  rng?: () => number;
  /** Hour 0–23 for time-range conditionals; defaults to local now. */
  currentHour?: number;
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
