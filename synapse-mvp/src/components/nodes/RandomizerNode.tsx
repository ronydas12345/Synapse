import { Handle, Position } from '@xyflow/react';
import { Dice5, ChevronDown, ChevronUp, Trash2, ListOrdered } from 'lucide-react';
import { usePathStore } from '../../store';
import { useState, memo } from 'react';
import { addTrackToRandomizerList, moveSequenceItemBetweenRandomizers, parseSequenceItemPayload, reorderRandomizerTracks, restoreTrackFromRandomizer, SEQUENCE_ITEM_MIME, syncParkedTracks } from '../../randomizerDrop';
import { getTrackDisplayMeta } from '../../trackMetadata';

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
    playCount?: number;
    isForever?: boolean;
    mode?: 'sequence' | 'randomizer';
  };
  id: string;
}

function RandomizerNode({ data = {}, id }: RandomizerNodeProps) {
  const { updateNodeData, nodes, edges, setNodes, setEdges, currentPlayingNodeId } = usePathStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const isPlaying = currentPlayingNodeId === id;

  const tracks = data?.tracks || [];
  const weights = data?.weights || Array(tracks.length).fill(10);
  const isCollapsed = data?.isCollapsed || false;
  const playCount = data?.playCount || 1;
  const isForever = data?.isForever || false;
  const mode = data?.mode || 'sequence';
  const showWeights = mode === 'randomizer';

  const toggleCollapse = () => {
    updateNodeData(id, { isCollapsed: !isCollapsed });
  };

  const removeTrack = (index: number) => {
    const trackId = tracks[index];
    if (!trackId) return;
    const restored = restoreTrackFromRandomizer(nodes, edges, id, trackId);
    if (restored) {
      setNodes(restored.nodes);
      setEdges(restored.edges);
    }
  };

  const handleTrackDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData(
      SEQUENCE_ITEM_MIME,
      JSON.stringify({
        kind: 'sequence-item',
        randomizerId: id,
        trackId: tracks[index],
        index,
      })
    );
  };

  const handleTrackDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleTrackDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDraggedOverIndex(null);
      return;
    }
    const reordered = reorderRandomizerTracks({ tracks, weights }, draggedIndex, targetIndex);
    if (reordered) updateNodeData(id, reordered);
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    const next = [...weights];
    next[index] = Math.max(1, newWeight);
    updateNodeData(id, { weights: next });
  };

  const getTrackLabel = (trackId: string) => {
    const trackNode = nodes.find((n) => n.id === trackId);
    if (!trackNode) return 'Missing track';
    return getTrackDisplayMeta(trackNode.data).title;
  };

  const handleNodeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleNodeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    try {
      const sequenceItem = parseSequenceItemPayload(
        e.dataTransfer.getData(SEQUENCE_ITEM_MIME)
      );
      if (sequenceItem) {
        if (sequenceItem.randomizerId === id) return;
        const moved = moveSequenceItemBetweenRandomizers(
          nodes,
          edges,
          sequenceItem.randomizerId,
          id,
          sequenceItem.trackId
        );
        if (moved) {
          setNodes(moved.nodes);
          setEdges(moved.edges);
        }
        return;
      }
      const draggedNodeData = JSON.parse(e.dataTransfer.getData('application/reactflow') || '{}');
      if (draggedNodeData.type === 'track' && draggedNodeData.nodeId) {
        const added = addTrackToRandomizerList({ tracks, weights }, draggedNodeData.nodeId);
        if (added) {
          const withList = nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...added } } : n
          );
          const synced = syncParkedTracks(withList, edges);
          setNodes(synced.nodes);
          setEdges(synced.edges);
        }
      }
    } catch {
      // not a palette payload
    }
  };

  return (
    <>
      <style>{spinnerHideStyles}</style>
      <div
        className={`synapse-node w-56 overflow-hidden transition ${
          isPlaying
            ? 'border-[rgba(232,164,92,0.85)]'
            : mode === 'randomizer'
              ? 'border-[rgba(62,207,191,0.5)]'
              : 'border-[rgba(120,160,255,0.45)]'
        } ${isDragOver ? 'bg-[var(--bg-hover)]' : ''}`}
        data-randomizer-id={id}
        onDragOver={handleNodeDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleNodeDrop}
      >
        <div className="synapse-node-header" onClick={toggleCollapse}>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              {mode === 'randomizer' ? (
                <Dice5 className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <ListOrdered className="w-4 h-4 text-[rgb(120,160,255)]" />
              )}
              {isPlaying && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-warm)]" />
              )}
            </div>
            <strong
              className="text-sm text-[var(--text)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {mode === 'randomizer' ? 'Randomizer' : 'Sequence'}
            </strong>
            {tracks.length > 0 ? (
              <span className="text-[0.65rem] text-[var(--text-faint)] font-mono">
                {tracks.length}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateNodeData(id, {
                mode: mode === 'sequence' ? 'randomizer' : 'sequence',
              });
            }}
            className={`nodrag nopan text-[0.65rem] px-2 py-1 rounded-md border font-mono tracking-wide transition ${
              mode === 'randomizer'
                ? 'bg-[var(--accent-dim)] border-[rgba(62,207,191,0.4)] text-[var(--accent)]'
                : 'bg-[rgba(120,160,255,0.12)] border-[rgba(120,160,255,0.35)] text-[rgb(160,190,255)]'
            }`}
            title={`Switch to ${mode === 'randomizer' ? 'Sequence' : 'Randomizer'} mode`}
          >
            {mode === 'randomizer' ? 'RND' : 'SEQ'}
          </button>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {!isCollapsed && (
          <div className="p-3 space-y-2">
            <div className="nodrag nopan space-y-2 p-2 bg-slate-700 rounded border border-purple-400/30">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-300 font-semibold">Play Count:</label>
                <button
                  type="button"
                  onClick={() => updateNodeData(id, { isForever: !isForever })}
                  className={`text-xs px-2 py-1 rounded border transition ${
                    isForever
                      ? 'bg-purple-600 border-purple-400 text-purple-100'
                      : 'bg-slate-600 border-slate-400 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {isForever ? '∞' : 'Loop'}
                </button>
              </div>
              {!isForever && (
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={playCount}
                  onChange={(e) =>
                    updateNodeData(id, {
                      playCount: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="hide-spinners w-full text-xs px-2 py-1 bg-slate-600 border border-slate-400 rounded text-slate-100 text-center"
                />
              )}
            </div>

            {tracks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tracks.map((trackId, index) => {
                  const weight = weights[index] || 10;
                  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
                  const percentage = Math.round((weight / totalWeight) * 100);
                  const borderColor =
                    mode === 'randomizer' ? 'border-purple-400' : 'border-blue-400';
                  return (
                    <div
                      key={`${trackId}-${index}`}
                      draggable
                      onDragStart={(e) => handleTrackDragStart(e, index)}
                      onDragOver={(e) => handleTrackDragOver(e, index)}
                      onDrop={(e) => handleTrackDrop(e, index)}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDraggedOverIndex(null);
                      }}
                      className={`nodrag nopan flex items-center gap-2 p-2 bg-slate-600 rounded border-l-2 ${borderColor} cursor-move hover:bg-slate-500 transition ${
                        draggedOverIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-200 font-semibold truncate">
                          {index + 1}. {getTrackLabel(trackId)}
                        </div>
                        {showWeights ? (
                          <div className="flex items-center gap-1 nodrag nopan">
                            <input
                              type="number"
                              min="1"
                              value={weight}
                              onChange={(e) =>
                                handleWeightChange(index, parseInt(e.target.value) || 1)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="hide-spinners w-8 text-xs px-1 py-0 bg-slate-500 border border-slate-400 rounded text-slate-100 text-center"
                            />
                            <span className="text-xs text-slate-400">({percentage}%)</span>
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTrack(index)}
                        className="nodrag nopan p-1 text-red-400 hover:bg-red-600 hover:text-white rounded transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2 text-center">
                Drag track nodes onto this {mode === 'randomizer' ? 'randomizer' : 'sequence'}
              </div>
            )}
          </div>
        )}

        <Handle type="target" position={Position.Left} className="synapse-handle" />
        <Handle type="source" position={Position.Right} className="synapse-handle" />
      </div>
    </>
  );
}

export default memo(RandomizerNode);
