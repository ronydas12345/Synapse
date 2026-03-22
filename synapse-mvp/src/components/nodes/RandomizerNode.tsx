import { Handle, Position } from '@xyflow/react';
import { Dice5, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { usePathStore } from '../../store';
import { useState } from 'react';

const spinnerHideStyles = `
  input[type="number"].hide-spinners::-webkit-outer-spin-button,
  input[type="number"].hide-spinners::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"].hide-spinners {
    -moz-appearance: textfield;
  }
`;

interface RandomizerNodeProps {
  data?: {
    tracks?: string[];
    weights?: number[];
    isCollapsed?: boolean;
  };
  id: string;
}

export default function RandomizerNode({ data = {}, id }: RandomizerNodeProps) {
  const { updateNodeData, nodes } = usePathStore();
  const [draggedTrack, setDraggedTrack] = useState<string | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const tracks = data?.tracks || [];
  const weights = data?.weights || Array(tracks.length).fill(100 / Math.max(tracks.length, 1));
  const isCollapsed = data?.isCollapsed || false;

  const toggleCollapse = () => {
    updateNodeData(id, { isCollapsed: !isCollapsed });
  };

  const removeTrack = (index: number) => {
    const newTracks = tracks.filter((_, i) => i !== index);
    const newWeights = weights.filter((_, i) => i !== index);
    updateNodeData(id, { tracks: newTracks, weights: newWeights });
  };

  const handleTrackDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTrack(String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTrackDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleTrackDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTrack === null) return;

    const sourceIndex = parseInt(draggedTrack);
    if (sourceIndex === targetIndex) {
      setDraggedTrack(null);
      setDraggedOverIndex(null);
      return;
    }

    // Reorder tracks
    const newTracks = [...tracks];
    const newWeights = [...weights];
    const [movedTrack] = newTracks.splice(sourceIndex, 1);
    const [movedWeight] = newWeights.splice(sourceIndex, 1);

    newTracks.splice(targetIndex, 0, movedTrack);
    newWeights.splice(targetIndex, 0, movedWeight);

    updateNodeData(id, { tracks: newTracks, weights: newWeights });
    setDraggedTrack(null);
    setDraggedOverIndex(null);
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    const newWeights = [...weights];
    newWeights[index] = Math.max(1, newWeight);
    updateNodeData(id, { weights: newWeights });
  };

  const getTrackLabel = (trackId: string) => {
    const trackNode = nodes.find((n) => n.id === trackId);
    if (!trackNode) return trackId;
    const videoId = trackNode.data?.videoId as string | undefined;
    return videoId ? videoId.substring(0, 6) + '...' : 'Track';
  };

  const handleNodeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleNodeDragLeave = () => {
    setIsDragOver(false);
  };

  const handleNodeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const draggedNodeData = JSON.parse(e.dataTransfer.getData('application/reactflow') || '{}');
      // Only accept track nodes
      if (draggedNodeData.type === 'track' && draggedNodeData.nodeId) {
        const trackId = draggedNodeData.nodeId;
        if (!tracks.includes(trackId)) {
          const newTracks = [...tracks, trackId];
          const newWeights = [...weights, 50];
          const total = newWeights.reduce((a, b) => a + b, 0);
          const normalizedWeights = newWeights.map((w) => Math.round((w / total) * 100));
          updateNodeData(id, { tracks: newTracks, weights: normalizedWeights });
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <>
      <style>{spinnerHideStyles}</style>
      <div
        className={`bg-slate-800 border-2 rounded-lg shadow-lg overflow-hidden w-56 transition ${
          isDragOver ? 'border-purple-300 bg-slate-700' : 'border-purple-500 bg-slate-800'
        }`}
        onDragOver={handleNodeDragOver}
        onDragLeave={handleNodeDragLeave}
        onDrop={handleNodeDrop}
      >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 bg-slate-700 p-3 cursor-pointer hover:bg-slate-600"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2 flex-1">
          <Dice5 className="w-4 h-4 text-purple-400" />
          <strong className="text-sm text-slate-100">Randomizer</strong>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2 bg-slate-750">
          {/* Track List */}
          {tracks.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tracks.map((trackId, index) => {
                const weight = weights[index] || 10;
                const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
                const percentage = Math.round((weight / totalWeight) * 100);
                return (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleTrackDragStart(e, index)}
                    onDragOver={(e) => handleTrackDragOver(e, index)}
                    onDrop={(e) => handleTrackDrop(e, index)}
                    className={`flex items-center gap-2 p-2 bg-slate-600 rounded border-l-2 border-purple-400 cursor-move hover:bg-slate-500 transition ${
                      draggedOverIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-200 font-semibold truncate">
                        {getTrackLabel(trackId)}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={weight}
                          onChange={(e) => handleWeightChange(index, parseInt(e.target.value) || 1)}
                          onClick={(e) => e.stopPropagation()}
                          className="hide-spinners w-8 text-xs px-1 py-0 bg-slate-500 border border-slate-400 rounded text-slate-100 text-center"
                        />
                        <span className="text-xs text-slate-400">({percentage}%)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTrack(index)}
                      className="p-1 text-red-400 hover:bg-red-600 hover:text-white rounded transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">Drag tracks here</div>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}
