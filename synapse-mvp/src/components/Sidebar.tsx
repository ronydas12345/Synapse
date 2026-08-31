import { Music, GitBranch, Plus, Play, Square, Trash2, Dice5, MessageSquare, ArrowRight } from 'lucide-react';
import { usePathStore } from '../store';
import { useCallback } from 'react';
import { extractYouTubeId } from '../playback';

interface NodeType {
  type: string;
  label: string;
  icon: React.ReactNode;
  defaultData: Record<string, any>;
}

const NODE_TYPES: NodeType[] = [
  {
    type: 'start',
    label: 'Start Node',
    icon: <Play className="w-4 h-4" />,
    defaultData: { label: 'Start' },
  },
  {
    type: 'track',
    label: 'Track Node',
    icon: <Music className="w-4 h-4" />,
    defaultData: {
      videoId: '',
      songTitle: '',
      artist: '',
      album: '',
      startTime: 0,
      endTime: 0,
      duration: 0,
      volume: 100,
      label: '',
      playCount: 1,
    },
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: <GitBranch className="w-4 h-4" />,
    defaultData: { numPaths: 2, weights: [10, 10], mode: 'random', pathTimeRanges: [[{ start: 0, end: 23 }], [{ start: 0, end: 23 }]] },
  },
  {
    type: 'randomizer',
    label: 'Randomizer/Sequence',
    icon: <Dice5 className="w-4 h-4" />,
    defaultData: { tracks: [], weights: [], isCollapsed: false, playCount: 1, mode: 'sequence' },
  },
  {
    type: 'transition',
    label: 'Transition',
    icon: <ArrowRight className="w-4 h-4" />,
    defaultData: { type: 'silence', duration: 1, audioFile: null, videoId: '' },
  },
  {
    type: 'comment',
    label: 'Comment',
    icon: <MessageSquare className="w-4 h-4" />,
    defaultData: { text: '', linkedNodeId: null },
  },
  {
    type: 'end',
    label: 'End Node',
    icon: <Square className="w-4 h-4" />,
    defaultData: { label: 'End' },
  },
];

interface SliderInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function SliderInput({ label, value, min = 0, max = 100, step = 1, suffix = '', onChange }: SliderInputProps) {
  return (
    <div className="space-y-1.5">
      <label>{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 cursor-pointer"
        />
        <div className="flex items-center gap-1 min-w-fit">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-14 p-1 text-center text-xs"
          />
          <span className="text-[0.65rem] text-[var(--text-faint)] font-mono">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { nodes, setNodes, selectedNodeId, selectNode, updateNodeData, deleteNode, normalizeSplitters } = usePathStore();
  const selectedNode = nodes.find(n => n.id === selectedNodeId) as any;

  const handleAddNode = useCallback(
    (nodeType: NodeType) => {
      if (nodeType.type === 'start' && nodes.some(n => n.type === 'start')) {
        alert('There can only be one start node');
        return;
      }

      const newNode = {
        id: `${nodeType.type}-${Date.now()}`,
        type: nodeType.type,
        position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
        data: { ...nodeType.defaultData },
      };
      setNodes([...nodes, newNode as any]);
    },
    [nodes, setNodes]
  );

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: nodeType.type,
        defaultData: nodeType.defaultData,
      })
    );
  };

  const handleDeleteNode = () => {
    if (selectedNode && window.confirm('Delete this node?')) {
      deleteNode(selectedNode.id);
    }
  };

  return (
    <aside className="synapse-sidebar">
      <div>
        <p className="synapse-section-label">Module rack</p>
        <h2
          className="text-lg font-semibold tracking-tight m-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Nodes
        </h2>
      </div>
      
      <div className="space-y-2">
        {NODE_TYPES.map((nodeType, idx) => (
          <div key={`${nodeType.type}-${idx}`}>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, nodeType)}
              onClick={() => handleAddNode(nodeType)}
              className="synapse-rack-item group"
            >
              <div className="synapse-rack-icon">{nodeType.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] m-0">{nodeType.label}</p>
                <p className="text-[0.65rem] text-[var(--text-faint)] m-0 mt-0.5 font-mono tracking-wide">
                  Drag or click
                </p>
              </div>
              <Plus className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {nodes.some((n) => n.type === 'conditional') && (
        <div className="mt-1">
          <button
            onClick={normalizeSplitters}
            className="synapse-btn-secondary"
            title="Flatten stacked conditionals into one with preserved probabilities"
          >
            Normalize Conditionals
          </button>
        </div>
      )}

      {selectedNode && (
        <>
          <div className="flex-1" />
          <div className="synapse-inspector">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="synapse-section-label">Inspector</p>
                <h3
                  className="font-semibold text-[var(--text)] m-0 tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Node Settings
                </h3>
              </div>
              <button
                onClick={handleDeleteNode}
                className="synapse-btn-danger-ghost"
                title="Delete node"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="synapse-inspector-card space-y-3 text-sm">
              <div>
                <label>Node Type</label>
                <p className="text-[var(--text-muted)] capitalize font-mono text-xs m-0">{selectedNode.type}</p>
              </div>
              {selectedNode.type === 'track' && (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Song Title</label>
                      <input
                        type="text"
                        placeholder="Song title"
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                        value={selectedNode.data?.songTitle || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { songTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Artist</label>
                      <input
                        type="text"
                        placeholder="Artist"
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                        value={selectedNode.data?.artist || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { artist: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">Album</label>
                      <input
                        type="text"
                        placeholder="Album"
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                        value={selectedNode.data?.album || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { album: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">YouTube Video ID or URL</label>
                      <input
                        type="text"
                        placeholder="dQw4w9wgVcQ or youtube.com/watch?v=…"
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                        value={selectedNode.data?.videoId || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const id = extractYouTubeId(raw);
                          updateNodeData(selectedNode.id, {
                            videoId: id || raw,
                          });
                        }}
                        onBlur={(e) => {
                          const id = extractYouTubeId(e.target.value);
                          if (id) updateNodeData(selectedNode.id, { videoId: id });
                        }}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          className="synapse-btn synapse-btn-ghost text-xs"
                          disabled={
                            !extractYouTubeId(String(selectedNode.data?.videoId || '')) ||
                            selectedNode.data?.metadataStatus === 'loading'
                          }
                          onClick={() =>
                            updateNodeData(selectedNode.id, {
                              metadataVideoId: '',
                              metadataRefreshRequested: true,
                              metadataStatus: 'idle',
                            })
                          }
                        >
                          Autofill credits
                        </button>
                        <span className="text-[0.65rem] text-[var(--text-faint)] font-mono">
                          {selectedNode.data?.metadataStatus === 'loading'
                            ? 'Looking up…'
                            : selectedNode.data?.metadataStatus === 'ready'
                              ? 'Filled from video'
                              : selectedNode.data?.metadataStatus === 'error'
                                ? 'Lookup failed'
                                : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase mb-2">Playback</h4>
                    <div className="space-y-3">
                      <SliderInput
                        label="Volume (%)"
                        value={selectedNode.data?.volume ?? 100}
                        min={0}
                        max={200}
                        step={5}
                        suffix="%"
                        onChange={(v) => updateNodeData(selectedNode.id, { volume: v })}
                      />
                      <SliderInput
                        label="Speed (%)"
                        value={selectedNode.data?.speed ?? 100}
                        min={25}
                        max={200}
                        step={5}
                        suffix="%"
                        onChange={(v) => updateNodeData(selectedNode.id, { speed: v })}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase mb-2">Time Range</h4>
                    <div className="space-y-3">
                      <SliderInput
                        label="Start Time (s)"
                        value={selectedNode.data?.startTime ?? 0}
                        min={0}
                        max={3600}
                        step={0.5}
                        suffix="s"
                        onChange={(v) => updateNodeData(selectedNode.id, { startTime: v })}
                      />
                      <SliderInput
                        label="End Time (s)"
                        value={selectedNode.data?.endTime ?? 0}
                        min={0}
                        max={3600}
                        step={0.5}
                        suffix="s"
                        onChange={(v) => updateNodeData(selectedNode.id, { endTime: v })}
                      />
                      <div className="text-xs text-slate-300 pt-2">
                        <strong>Duration:</strong> {selectedNode.data?.duration || 0}s
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase mb-2">EQ</h4>
                    <div className="space-y-3">
                      <SliderInput
                        label="Bass"
                        value={selectedNode.data?.bass ?? 0}
                        min={-50}
                        max={50}
                        step={1}
                        onChange={(v) => updateNodeData(selectedNode.id, { bass: v })}
                      />
                      <SliderInput
                        label="Treble"
                        value={selectedNode.data?.treble ?? 0}
                        min={-50}
                        max={50}
                        step={1}
                        onChange={(v) => updateNodeData(selectedNode.id, { treble: v })}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase mb-2">Pitch & Tempo</h4>
                    <div className="space-y-3">
                      <SliderInput
                        label="Pitch (semitones)"
                        value={selectedNode.data?.pitch ?? 0}
                        min={-12}
                        max={12}
                        step={0.5}
                        onChange={(v) => updateNodeData(selectedNode.id, { pitch: v })}
                      />
                      <SliderInput
                        label="Tempo (%)"
                        value={selectedNode.data?.tempo ?? 100}
                        min={50}
                        max={200}
                        step={5}
                        suffix="%"
                        onChange={(v) => updateNodeData(selectedNode.id, { tempo: v })}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase mb-2">Playback Count</h4>
                    <div className="space-y-3">
                      <SliderInput
                        label="Play Count"
                        value={selectedNode.data?.playCount ?? 1}
                        min={1}
                        max={50}
                        step={1}
                        onChange={(v) => updateNodeData(selectedNode.id, { playCount: Math.max(1, v) })}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-slate-300 text-xs"><strong>Duration:</strong> {selectedNode.data?.duration || 0}s</p>
                  </div>
                </>
              )}
              {(selectedNode.type === 'conditional' || selectedNode.type === 'splitter') && (
                <>
                  <div className="border-t border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase mb-3">Conditional Settings</h4>
                    <label className="text-slate-300 block mb-2 text-sm">Mode</label>
                    <select
                      value={selectedNode.data?.mode || 'random'}
                      onChange={(e) => {
                        const newMode = e.target.value;
                        // Initialize pathTimeRanges if switching to timeRange mode
                        if (newMode === 'timeRange' && !selectedNode.data?.pathTimeRanges) {
                          const numPaths = selectedNode.data?.numPaths || 2;
                          const pathTimeRanges = Array(numPaths).fill(null).map(() => [{ start: 0, end: 23 }]);
                          updateNodeData(selectedNode.id, { mode: newMode, pathTimeRanges });
                        } else {
                          updateNodeData(selectedNode.id, { mode: newMode });
                        }
                      }}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    >
                      <option value="random">Random (Weighted)</option>
                      <option value="timeRange">Time Ranges</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-700 pt-3">
                    <label className="text-slate-300 block mb-1">Number of Paths</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                      value={selectedNode.data?.numPaths || 2}
                      onChange={(e) => {
                        const newNumPaths = parseInt(e.target.value) || 2;
                        const oldWeights = (selectedNode.data?.weights as number[]) || Array(selectedNode.data?.numPaths || 2).fill(10);
                        const newWeights = Array(newNumPaths).fill(10);
                        const oldTimeRanges = (selectedNode.data?.pathTimeRanges as Array<Array<{start: number, end: number}>>) || [];
                        const newTimeRanges: Array<Array<{start: number, end: number}>> = [];
                        
                        // Preserve existing weights and time ranges if possible
                        for (let i = 0; i < newNumPaths; i++) {
                          newWeights[i] = oldWeights[i] || 10;
                          newTimeRanges[i] = oldTimeRanges[i] || [{ start: 0, end: 23 }];
                        }
                        updateNodeData(selectedNode.id, { numPaths: newNumPaths, weights: newWeights, pathTimeRanges: newTimeRanges });
                      }}
                    />
                  </div>

                  {selectedNode.data?.mode === 'random' && (
                    <>
                      {Array.from({ length: selectedNode.data?.numPaths || 2 }).map((_, i) => {
                        const weights = (selectedNode.data?.weights as number[]) || Array(selectedNode.data?.numPaths || 2).fill(10);
                        const weight = weights[i] || 10;
                        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0) || 1;
                        const percentage = Math.round((weight / totalWeight) * 100);
                        
                        return (
                          <div key={`path-${i}`} className="border-t border-slate-700 pt-3">
                            <label className="text-slate-300 block mb-1">Path {String.fromCharCode(65 + i)} Weight</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white"
                                value={weight}
                                onChange={(e) => {
                                  const newWeights = [...(selectedNode.data?.weights as number[])];
                                  newWeights[i] = Math.max(1, parseInt(e.target.value) || 1);
                                  updateNodeData(selectedNode.id, { weights: newWeights });
                                }}
                              />
                              <span className="text-xs text-slate-400 min-w-fit">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {selectedNode.data?.mode === 'timeRange' && (
                    <>
                      {Array.from({ length: selectedNode.data?.numPaths || 2 }).map((_, pathIdx) => {
                        const existingTimeRanges = (selectedNode.data?.pathTimeRanges as Array<Array<{start: number, end: number}>>) || [];
                        // Ensure we have time ranges for all paths
                        const allTimeRanges = Array.from({ length: selectedNode.data?.numPaths || 2 }, (_, i) => 
                          existingTimeRanges[i] || [{ start: 0, end: 23 }]
                        );
                        const timeRanges = allTimeRanges[pathIdx] || [{ start: 0, end: 23 }];
                        
                        return (
                          <div key={`path-time-${pathIdx}`} className="border-t border-slate-700 pt-3">
                            <label className="text-slate-300 block mb-2 font-semibold text-sm">
                              Path {String.fromCharCode(65 + pathIdx)} Time Ranges
                            </label>
                            <div className="space-y-2">
                              {timeRanges.map((range, rangeIdx) => (
                                <div key={rangeIdx} className="flex gap-2 items-end bg-slate-700 p-2 rounded">
                                  <div className="flex-1">
                                    <label className="text-xs text-slate-400 block mb-1">Start (0-23)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="23"
                                      className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                      value={range.start}
                                      onChange={(e) => {
                                        const newStart = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                                        const newTimeRanges = Array.from({ length: selectedNode.data?.numPaths || 2 }, (_, i) => 
                                          allTimeRanges[i] || [{ start: 0, end: 23 }]
                                        );
                                        newTimeRanges[pathIdx] = [...timeRanges];
                                        newTimeRanges[pathIdx][rangeIdx] = { ...range, start: newStart };
                                        updateNodeData(selectedNode.id, { pathTimeRanges: newTimeRanges });
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs text-slate-400 block mb-1">End (0-23)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="23"
                                      className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                      value={range.end}
                                      onChange={(e) => {
                                        const newEnd = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                                        const newTimeRanges = Array.from({ length: selectedNode.data?.numPaths || 2 }, (_, i) => 
                                          allTimeRanges[i] || [{ start: 0, end: 23 }]
                                        );
                                        newTimeRanges[pathIdx] = [...timeRanges];
                                        newTimeRanges[pathIdx][rangeIdx] = { ...range, end: newEnd };
                                        updateNodeData(selectedNode.id, { pathTimeRanges: newTimeRanges });
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newTimeRanges = Array.from({ length: selectedNode.data?.numPaths || 2 }, (_, i) => 
                                        allTimeRanges[i] || [{ start: 0, end: 23 }]
                                      );
                                      newTimeRanges[pathIdx] = timeRanges.filter((_, idx) => idx !== rangeIdx);
                                      if (newTimeRanges[pathIdx].length === 0) {
                                        newTimeRanges[pathIdx] = [{ start: 0, end: 23 }];
                                      }
                                      updateNodeData(selectedNode.id, { pathTimeRanges: newTimeRanges });
                                    }}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-500 rounded text-white text-xs font-semibold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newTimeRanges = Array.from({ length: selectedNode.data?.numPaths || 2 }, (_, i) => 
                                    allTimeRanges[i] || [{ start: 0, end: 23 }]
                                  );
                                  newTimeRanges[pathIdx] = [...timeRanges, { start: 0, end: 23 }];
                                  updateNodeData(selectedNode.id, { pathTimeRanges: newTimeRanges });
                                }}
                                className="w-full py-2 px-2 bg-slate-600 hover:bg-slate-500 rounded text-white text-xs font-semibold"
                              >
                                + Add Range
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
              {selectedNode.type === 'transition' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">Transition Type</label>
                    <select
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                      value={selectedNode.data?.type || 'silence'}
                      onChange={(e) => updateNodeData(selectedNode.id, { type: e.target.value })}
                    >
                      <option value="silence">Silence</option>
                      <option value="audio">Audio File</option>
                      <option value="youtube">YouTube Video</option>
                    </select>
                  </div>
                  {selectedNode.data?.type === 'silence' && (
                    <div>
                      <label className="text-slate-300 block mb-1">Duration (seconds)</label>
                      <input
                        type="number"
                        min="0.1"
                        max="30"
                        step="0.1"
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                        value={selectedNode.data?.duration || 1}
                        onChange={(e) => updateNodeData(selectedNode.id, { duration: Math.max(0.1, parseFloat(e.target.value) || 1) })}
                      />
                    </div>
                  )}
                  {selectedNode.data?.type === 'audio' && (
                    <div>
                      <label className="text-slate-300 block mb-1">Audio File (max 5MB)</label>
                      {selectedNode.data?.audioFile ? (
                        <div className="space-y-2">
                          <div className="p-2 bg-slate-700 border border-slate-600 rounded">
                            <p className="text-xs text-slate-300 break-all">{selectedNode.data?.fileName || 'audio file'}</p>
                          </div>
                          <button
                            onClick={() => updateNodeData(selectedNode.id, { audioFile: null, fileName: '' })}
                            className="w-full py-1 px-2 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors"
                          >
                            Clear File
                          </button>
                          <label className="block text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                            <span className="block py-2 text-center text-slate-300 hover:bg-slate-700 rounded border border-slate-600">Replace File</span>
                            <input
                              type="file"
                              accept="audio/mpeg,.mp3"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('File must be smaller than 5MB');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    updateNodeData(selectedNode.id, {
                                      audioFile: event.target?.result as string,
                                      fileName: file.name,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <span className="block py-2 px-2 text-center text-slate-300 bg-slate-700 border border-slate-600 rounded hover:bg-slate-600 transition-colors">Choose File</span>
                          <input
                            type="file"
                            accept="audio/mpeg,.mp3"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('File must be smaller than 5MB');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  updateNodeData(selectedNode.id, {
                                    audioFile: event.target?.result as string,
                                    fileName: file.name,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  {selectedNode.data?.type === 'youtube' && (
                    <div>
                      <label className="text-slate-300 block mb-1">YouTube Video ID</label>
                      <input
                        type="text"
                        placeholder="dQw4w9wgxcq"
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                        value={selectedNode.data?.videoId || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { videoId: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}
              {selectedNode.type === 'randomizer' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">Play Count</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                      value={selectedNode.data?.playCount || 1}
                      onChange={(e) => updateNodeData(selectedNode.id, { playCount: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                    <p className="text-xs text-slate-500 mt-1 mb-3">How many times to play all tracks</p>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-2">Add Tracks</label>
                    {nodes
                      .filter((n) => n.type === 'track')
                      .map((trackNode) => {
                        const isAdded = selectedNode.data?.tracks?.includes(trackNode.id);
                        return (
                          <div
                            key={trackNode.id}
                            className="flex items-center gap-2 p-2 bg-slate-700 rounded mb-2 hover:bg-slate-600 cursor-pointer transition"
                            onClick={() => {
                              const currentTracks = selectedNode.data?.tracks || [];
                              let newTracks, newWeights;
                              if (isAdded) {
                                const idx = currentTracks.indexOf(trackNode.id);
                                newTracks = currentTracks.filter((id: string) => id !== trackNode.id);
                                newWeights = (selectedNode.data?.weights || []).filter(
                                  (_: number, i: number) => i !== idx
                                );
                              } else {
                                newTracks = [...currentTracks, trackNode.id];
                                newWeights = [...(selectedNode.data?.weights || []), 10];
                              }
                              updateNodeData(selectedNode.id, {
                                tracks: newTracks,
                                weights: newWeights,
                              });
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isAdded}
                              readOnly
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs text-slate-200 flex-1">
                              {(trackNode.data?.videoId as string)?.substring(0, 8) || 'Track'}
                            </span>
                          </div>
                        );
                      })}
                    {nodes.filter((n) => n.type === 'track').length === 0 && (
                      <p className="text-xs text-slate-500 italic">No track nodes created yet</p>
                    )}
                  </div>
                  {selectedNode.data?.tracks && selectedNode.data.tracks.length > 0 && (
                    <div>
                      <label className="text-slate-300 block mb-2">Tracks & Weights</label>
                      <div className="bg-slate-700 rounded p-2 space-y-3 max-h-48 overflow-y-auto">
                        {selectedNode.data.tracks.map((trackId: string, i: number) => {
                          const trackNode = nodes.find((n) => n.id === trackId);
                          const weight = selectedNode.data?.weights?.[i] || 10;
                          const totalWeight = (selectedNode.data?.weights || []).reduce((a: number, b: number) => a + b, 0) || 1;
                          const percentage = Math.round((weight / totalWeight) * 100);
                          
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="YouTube ID"
                                  value={(trackNode?.data?.videoId as string) || ''}
                                  onChange={(e) => {
                                    // Update the track node's videoId directly
                                    updateNodeData(trackId, { videoId: e.target.value });
                                  }}
                                  className="flex-1 text-xs px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-500"
                                />
                                <button
                                  onClick={() => {
                                    const idx = selectedNode.data.tracks.indexOf(trackId);
                                    const newTracks = selectedNode.data.tracks.filter((id: string) => id !== trackId);
                                    const newWeights = (selectedNode.data?.weights || []).filter((_: number, j: number) => j !== idx);
                                    updateNodeData(selectedNode.id, { tracks: newTracks, weights: newWeights });
                                  }}
                                  className="p-1 text-red-400 hover:bg-red-600 hover:text-white rounded transition"
                                  title="Remove track"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 px-1">
                                <label className="text-xs text-slate-400">Weight:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={weight}
                                  onChange={(e) => {
                                    const newWeights = [...(selectedNode.data?.weights || [])];
                                    newWeights[i] = Math.max(1, parseInt(e.target.value) || 1);
                                    updateNodeData(selectedNode.id, { weights: newWeights });
                                  }}
                                  className="w-16 text-xs px-1 py-0 bg-slate-600 border border-slate-500 rounded text-slate-100 text-center"
                                />
                                <span className="text-xs text-slate-400 flex-1">({percentage}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedNode.type === 'comment' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">Comment Text</label>
                    <textarea
                      placeholder="Add a note or comment..."
                      value={selectedNode.data?.text || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm placeholder-slate-500 resize-none h-24 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  {selectedNode.data?.linkedNodeId && (
                    <div className="mt-3">
                      <label className="text-slate-300 block mb-1">Linked Node</label>
                      <div className="p-2 bg-slate-700 border border-slate-600 rounded">
                        <p className="text-xs text-slate-400">
                          ID: <span className="text-slate-300 font-mono">{selectedNode.data?.linkedNodeId}</span>
                        </p>
                        <button
                          onClick={() => updateNodeData(selectedNode.id, { linkedNodeId: null })}
                          className="text-xs text-red-400 hover:text-red-300 mt-2"
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => selectNode(null)}
              className="w-full mt-3 synapse-btn synapse-btn-ghost"
              style={{ borderRadius: '8px', width: '100%' }}
            >
              Deselect
            </button>
          </div>
        </>
      )}

      {!selectedNode && (
        <>
          <div className="flex-1" />
          <div className="mt-2 pt-3 border-t border-[var(--border)]">
            <p className="synapse-section-label">Guide</p>
            <p className="text-xs text-[var(--text-muted)] mb-3 m-0 leading-relaxed">
              Tip: Click nodes on canvas to edit. Click edges to delete.
            </p>
            <div className="synapse-inspector-card text-xs text-[var(--text-muted)]">
              <p className="font-semibold mb-2 text-[var(--text)] m-0" style={{ fontFamily: 'var(--font-display)' }}>
                Building paths
              </p>
              <ul className="space-y-1.5 list-none p-0 m-0 font-mono text-[0.65rem] tracking-wide">
                <li className="flex gap-2"><span className="text-[var(--accent)]">01</span> Start with Start node</li>
                <li className="flex gap-2"><span className="text-[var(--accent)]">02</span> Add Track nodes</li>
                <li className="flex gap-2"><span className="text-[var(--accent)]">03</span> Use Conditionals to branch</li>
                <li className="flex gap-2"><span className="text-[var(--accent)]">04</span> Randomizer for pools</li>
                <li className="flex gap-2"><span className="text-[var(--accent)]">05</span> Click edges to delete</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
