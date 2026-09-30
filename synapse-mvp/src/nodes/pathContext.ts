import type { Edge, Node } from '@xyflow/react';
import { parseQueueKey } from '../engine/types';
import { nodeDisplayName, nodeTypeLabel } from './nodeName';

export type SequenceMembership = {
  id: string;
  name: string;
  mode: 'sequence' | 'randomizer';
  index: number;
  total: number;
};

export function sequencesContaining(
  nodes: Node[],
  trackId: string
): SequenceMembership[] {
  const out: SequenceMembership[] = [];
  for (const node of nodes) {
    if (node.type !== 'randomizer') continue;
    const tracks = (node.data?.tracks as string[]) || [];
    const index = tracks.indexOf(trackId);
    if (index < 0) continue;
    out.push({
      id: node.id,
      name: nodeDisplayName(node.type, node.data),
      mode: node.data?.mode === 'randomizer' ? 'randomizer' : 'sequence',
      index,
      total: tracks.length,
    });
  }
  return out;
}

/**
 * Keep inspecting a parked sequence track when the canvas still has that
 * sequence selected. Empty or multi-select clears the inspector.
 */
export function resolveInspectorNodeId(
  nodes: Node[],
  canvasIds: string[],
  currentInspectorId: string | null
): string | null {
  if (canvasIds.length === 0) return null;
  if (canvasIds.length > 1) return null;
  const canvasId = canvasIds[0];
  if (
    currentInspectorId &&
    currentInspectorId !== canvasId &&
    sequencesContaining(nodes, currentInspectorId).some((seq) => seq.id === canvasId)
  ) {
    return currentInspectorId;
  }
  return canvasId;
}

export function neighborLabels(
  nodes: Node[],
  edges: Edge[],
  nodeId: string
): { incoming: string[]; outgoing: string[] } {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const label = (id: string) =>
    nodeDisplayName(byId.get(id)?.type, byId.get(id)?.data);
  return {
    incoming: edges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => label(edge.source)),
    outgoing: edges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => label(edge.target)),
  };
}

export function queuePosition(
  playbackQueue: string[],
  nodeId: string
): { index: number; total: number } | null {
  const total = playbackQueue.length;
  if (!total) return null;
  const index = playbackQueue.findIndex((key) => parseQueueKey(key)?.nodeId === nodeId);
  if (index < 0) return null;
  return { index, total };
}

export function typeCaption(type: string | undefined, data?: unknown): string {
  return nodeTypeLabel(type, data);
}
