import { Handle, Position } from '@xyflow/react';
import { Dice5, ChevronDown, ChevronUp, Trash2, ListOrdered } from 'lucide-react';
import { usePathStore } from '../../store';
import { useState, memo } from 'react';
import { addTrackToRandomizerList, moveSequenceItemBetweenRandomizers, parseSequenceItemPayload, reorderRandomizerTracks, restoreTrackFromRandomizer, SEQUENCE_ITEM_MIME, syncParkedTracks } from '../../randomizerDrop';
import { getTrackDisplayMeta } from '../../trackMetadata';
import { RANDOMIZER_MODE_OPTIONS, randomizerModePatch } from '../../nodeMode';

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
        className={`synapse-node w-80 overflow-hidden transition is-randomizer ${
          isPlaying ? 'is-playing' : mode === 'sequence' ? 'is-sequence' : ''
        } ${isDragOver ? 'bg-[var(--bg-hover)]' : ''}`}
        data-randomizer-id={id}
        onDragOver={handleNodeDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleNodeDrop}
      >
        <div className="synapse-node-header synapse-node-header-with-mode" onClick={toggleCollapse}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              {mode === 'randomizer' ? (
                <Dice5 className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <ListOrdered className="w-4 h-4 text-[var(--node-randomizer)]" />
              )}
              {isPlaying && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-warm)]" />
              )}
            </div>
            <strong
              className="text-sm text-[var(--text)] truncate"
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
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
          )}
          <select
            className="nodrag nopan nowheel synapse-node-mode-select"
            value={mode === 'randomizer' ? 'randomizer' : 'sequence'}
            title="Playback mode"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              updateNodeData(id, randomizerModePatch(data, e.target.value));
            }}
          >
            {RANDOMIZER_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {!isCollapsed && (
          <div className="p-3 space-y-2">
            <div className="nodrag nopan synapse-node-count space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="synapse-node-row-title">Play Count:</label>
                <button
                  type="button"
                  onClick={() => updateNodeData(id, { isForever: !isForever })}
                  className={`synapse-node-chip ${isForever ? 'is-on' : ''}`}
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
                  className="hide-spinners synapse-node-field is-wide"
                />
              )}
            </div>

            {tracks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tracks.map((trackId, index) => {
                  const weight = weights[index] || 10;
                  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
                  const percentage = Math.round((weight / totalWeight) * 100);
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
                      className={`nodrag nopan synapse-node-row is-seq is-item cursor-move ${
                        draggedOverIndex === index ? 'is-drag' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="synapse-node-row-title truncate">
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
                              className="hide-spinners synapse-node-field w-8"
                            />
                            <span className="synapse-node-muted">({percentage}%)</span>
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTrack(index)}
                        className="nodrag nopan p-1 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--bg-void)] rounded transition self-start"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="synapse-node-muted italic py-2 text-center">
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
