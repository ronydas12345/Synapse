import { Trash2, ChevronDown } from 'lucide-react';
import { usePathStore } from '../store';
import { extractYouTubeId, formatClock } from '../playback';
import { getTrackDisplayMeta } from '../trackMetadata';
import { restoreTrackFromRandomizer } from '../randomizerDrop';
import { clampTrackTimes, displayEndTime, parseClock } from '../playback/trackTimes';
import {
  CONDITIONAL_MODE_OPTIONS,
  RANDOMIZER_MODE_OPTIONS,
  conditionalModePatch,
  randomizerModePatch,
} from '../nodeMode';

interface SliderInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function TimeRangeFields({
  startTime,
  endTime,
  duration,
  onChange,
}: {
  startTime: number;
  endTime: number;
  duration: number;
  onChange: (next: { startTime: number; endTime: number }) => void;
}) {
  const known = duration > 0;
  const max = known ? duration : 0;
  const start = known ? Math.min(startTime, duration) : startTime;
  const endDisplay = known ? displayEndTime(endTime, duration) : endTime;

  const commit = (nextStart: number, nextEnd: number) => {
    const clamped = clampTrackTimes(nextStart, nextEnd, duration);
    onChange({ startTime: clamped.startTime, endTime: clamped.endTime });
  };

  const onClockBlur = (raw: string, which: 'start' | 'end') => {
    const parsed = parseClock(raw);
    if (parsed == null) return;
    if (which === 'start') commit(parsed, endTime);
    else commit(startTime, parsed);
  };

  return (
    <div className="space-y-3">
      {!known ? (
        <p className="text-xs text-[var(--text-faint)] m-0">
          Duration unknown until this video plays. End means “full length” until then.
        </p>
      ) : (
        <p className="text-xs text-[var(--text-faint)] m-0">
          Duration: {formatClock(duration)}
        </p>
      )}
      <div className="space-y-1.5">
        <label>Start</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={0}
            max={known ? max : Math.max(start, 1)}
            step={0.1}
            disabled={!known}
            value={start}
            onChange={(e) => commit(parseFloat(e.target.value), endTime)}
            className="flex-1 cursor-pointer"
          />
          <input
            type="text"
            className="w-16 p-1 text-center text-xs font-mono"
            defaultValue={formatClock(start)}
            key={`start-${start.toFixed(1)}-${duration}`}
            onBlur={(e) => onClockBlur(e.target.value, 'start')}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label>End</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={0}
            max={known ? max : Math.max(endDisplay, 1)}
            step={0.1}
            disabled={!known}
            value={endDisplay}
            onChange={(e) => commit(startTime, parseFloat(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <input
            type="text"
            className="w-16 p-1 text-center text-xs font-mono"
            defaultValue={formatClock(endDisplay)}
            key={`end-${endDisplay.toFixed(1)}-${duration}`}
            onBlur={(e) => onClockBlur(e.target.value, 'end')}
          />
        </div>
      </div>
    </div>
  );
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

export default function NodeInspector() {
  const { nodes, edges, setNodes, setEdges, selectedNodeId, selectNode, updateNodeData, deleteNode } = usePathStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as any;

  if (!selectedNode) return null;

  const handleDeleteNode = () => {
    if (window.confirm('Delete this node?')) {
      deleteNode(selectedNode.id);
    }
  };

  return (
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
              <TimeRangeFields
                startTime={Number(selectedNode.data?.startTime) || 0}
                endTime={Number(selectedNode.data?.endTime) || 0}
                duration={Number(selectedNode.data?.duration) || 0}
                onChange={(next) => updateNodeData(selectedNode.id, next)}
              />
            </div>

            <details className="group border-t border-slate-700 pt-3">
              <summary className="flex items-center justify-between gap-2 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-xs font-semibold text-slate-200 uppercase m-0">
                  Experimental / not yet applied
                </h4>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-[0.7rem] text-[var(--accent-warm)] mt-2 mb-3 leading-relaxed">
                These settings currently do nothing in playback. YouTube’s player cannot apply EQ
                or pitch-shift; only Speed % is used. They will be implemented eventually.
              </p>
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
              <h4 className="text-xs font-semibold text-slate-200 uppercase mb-2 mt-4">Pitch & Tempo</h4>
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
            </details>

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
              <label className="text-slate-300 block mb-2 text-sm">Conditional Type</label>
              <select
                value={selectedNode.data?.mode || 'random'}
                onChange={(e) => {
                  updateNodeData(
                    selectedNode.id,
                    conditionalModePatch(selectedNode.data, e.target.value)
                  );
                }}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                {CONDITIONAL_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
              <label className="text-slate-300 block mb-1">Playback Mode</label>
              <select
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                value={selectedNode.data?.mode || 'sequence'}
                onChange={(e) =>
                  updateNodeData(
                    selectedNode.id,
                    randomizerModePatch(selectedNode.data, e.target.value)
                  )
                }
              >
                {RANDOMIZER_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
            <p className="text-xs text-[var(--text-muted)] leading-relaxed m-0 mb-3">
              Drag a track onto this {selectedNode.data?.mode === 'randomizer' ? 'randomizer' : 'sequence'} to move it in. The track leaves the canvas and appears in the list. Drag a list item out to restore it.
            </p>
            {selectedNode.data?.tracks && selectedNode.data.tracks.length > 0 && (
              <div>
                <label className="text-slate-300 block mb-2">
                  {selectedNode.data?.mode === 'randomizer' ? 'Tracks & Weights' : 'Order'}
                </label>
                <div className="bg-slate-700 rounded p-2 space-y-3 max-h-48 overflow-y-auto">
                  {selectedNode.data.tracks.map((trackId: string, i: number) => {
                    const trackNode = nodes.find((n) => n.id === trackId);
                    const meta = getTrackDisplayMeta(trackNode?.data);
                    const weight = selectedNode.data?.weights?.[i] || 10;
                    const totalWeight = (selectedNode.data?.weights || []).reduce((a: number, b: number) => a + b, 0) || 1;
                    const percentage = Math.round((weight / totalWeight) * 100);

                    return (
                      <div key={trackId} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-xs text-slate-100 truncate">
                            {i + 1}. {meta.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const restored = restoreTrackFromRandomizer(
                                nodes,
                                edges,
                                selectedNode.id,
                                trackId
                              );
                              if (restored) {
                                setNodes(restored.nodes);
                                setEdges(restored.edges);
                              }
                            }}
                            className="p-1 text-red-400 hover:bg-red-600 hover:text-white rounded transition"
                            title="Remove from sequence and restore to canvas"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {selectedNode.data?.mode === 'randomizer' ? (
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
                        ) : null}
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
  );
}
