import { NodeToolbar, Position } from '@xyflow/react';
import { usePathStore } from '../store';
import {
  PLAYBACK_MARKER_MIME,
  PLAYBACK_MARKER_TEXT,
  resolvePlaybackMarkerNodeId,
} from '../playbackMarker';

export default function PlaybackMarker() {
  const nodes = usePathStore((s) => s.nodes);
  const currentPlayingNodeId = usePathStore((s) => s.currentPlayingNodeId);
  const selectedPlaybackStartNodeId = usePathStore(
    (s) => s.selectedPlaybackStartNodeId
  );
  const markerId = resolvePlaybackMarkerNodeId(
    currentPlayingNodeId,
    selectedPlaybackStartNodeId,
    nodes
  );

  if (!markerId) return null;

  const onDragStart = (event: React.DragEvent) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(PLAYBACK_MARKER_MIME, markerId);
    event.dataTransfer.setData('text/plain', `${PLAYBACK_MARKER_TEXT}:${markerId}`);
  };

  return (
    <NodeToolbar
      nodeId={markerId}
      isVisible
      position={Position.Top}
      offset={6}
      className="synapse-playback-marker-toolbar nodrag nopan nowheel"
    >
      <div
        className="synapse-playback-marker nodrag nopan"
        draggable
        onDragStart={onDragStart}
        title="Now playing — drag onto another node to start from there"
        aria-label="Playback marker. Drag to choose a start node."
      />
    </NodeToolbar>
  );
}
