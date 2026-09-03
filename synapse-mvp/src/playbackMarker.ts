import type { Node } from '@xyflow/react';
import { isPlaybackStartNodeType } from './engine/startNode';

export const PLAYBACK_MARKER_MIME = 'application/x-synapse-playback-marker';
export const PLAYBACK_MARKER_TEXT = 'synapse-playback-marker';

export function isPlaybackMarkerDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types || []).includes(PLAYBACK_MARKER_MIME);
}

export function dataTransferIsPlaybackMarker(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  try {
    const mime = dataTransfer.getData(PLAYBACK_MARKER_MIME);
    if (mime) return true;
  } catch {
    // some browsers only expose getData in drop
  }
  try {
    const text = dataTransfer.getData('text/plain');
    return text === PLAYBACK_MARKER_TEXT || text.startsWith(`${PLAYBACK_MARKER_TEXT}:`);
  } catch {
    return false;
  }
}

/** Map a queue/playback node id onto a visible canvas node when possible. */
export function visiblePlaybackMarkerNodeId(
  nodeId: string | null,
  nodes: Node[]
): string | null {
  if (!nodeId) return null;
  const node = nodes.find((n) => n.id === nodeId);
  if (node && !node.hidden) return nodeId;
  const owner = nodes.find(
    (n) =>
      n.type === 'randomizer' &&
      ((n.data?.tracks as string[]) || []).includes(nodeId)
  );
  return owner?.id ?? (node && !node.hidden ? nodeId : owner?.id ?? null);
}

/**
 * Marker host: current playing node, else chosen start, else the Start node.
 * Does not persist; callers pass live store values.
 */
export function resolvePlaybackMarkerNodeId(
  currentPlayingNodeId: string | null,
  selectedPlaybackStartNodeId: string | null,
  nodes: Node[]
): string | null {
  const playing = visiblePlaybackMarkerNodeId(currentPlayingNodeId, nodes);
  if (playing) return playing;
  const chosen = visiblePlaybackMarkerNodeId(selectedPlaybackStartNodeId, nodes);
  if (chosen) return chosen;
  const start = nodes.find((n) => n.type === 'start' && !n.hidden);
  return start?.id ?? null;
}

export function canDropPlaybackMarkerOn(type: string | undefined | null): boolean {
  return isPlaybackStartNodeType(type);
}
