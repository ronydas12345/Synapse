import { Music, GitBranch, Plus, Play, Square, Trash2, Dice5 } from 'lucide-react';
import { usePathStore } from '../store';
import { useCallback } from 'react';

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
    defaultData: { videoId: '', startTime: 0, duration: 0, label: 'Track' },
  },
  {
    type: 'splitter',
    label: 'Path Splitter',
    icon: <GitBranch className="w-4 h-4" />,
    defaultData: { numPaths: 2, weights: [10, 10] },
  },
  {
    type: 'randomizer',
    label: 'Randomizer',
    icon: <Dice5 className="w-4 h-4" />,
    defaultData: { tracks: [], weights: [], isCollapsed: false },
  },
  {
    type: 'end',
    label: 'End Node',
    icon: <Square className="w-4 h-4" />,
    defaultData: { label: 'End' },
  },
];

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
    <div className="w-80 bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col gap-3 h-full overflow-y-auto shadow-lg">
      <h2 className="text-lg font-bold text-white">Nodes</h2>
      
      <div className="space-y-2">
        {NODE_TYPES.map((nodeType) => (
          <div key={nodeType.type}>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, nodeType)}
              onClick={() => handleAddNode(nodeType)}
              className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-600 rounded-lg cursor-move hover:bg-slate-700 hover:border-slate-500 transition-colors group"
            >
              <div className="text-amber-500 group-hover:text-amber-400">{nodeType.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{nodeType.label}</p>
                <p className="text-xs text-slate-400">Drag or click</p>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
            </div>
          </div>
        ))}
      </div>

      {nodes.some((n) => n.type === 'splitter') && (
        <div className="mt-2">
          <button
            onClick={normalizeSplitters}
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium transition-colors"
            title="Flatten stacked splitters into one with preserved probabilities"
          >
            Normalize Splitters
          </button>
        </div>
      )}

      {selectedNode && (
        <>
          <div className="flex-1" />
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Node Settings</h3>
              <button
                onClick={handleDeleteNode}
                className="p-1 hover:bg-slate-700 rounded text-red-400 hover:text-red-300"
                title="Delete node"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-800 rounded p-3 space-y-3 text-sm">
              <div>
                <label className="text-slate-300 block mb-1">Node Type</label>
                <p className="text-slate-400 capitalize">{selectedNode.type}</p>
              </div>
              {selectedNode.type === 'track' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">Video ID</label>
                    <input
                      type="text"
                      placeholder="dQw4w9wgxcq"
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                      value={selectedNode.data?.videoId || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { videoId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Start Time (s)</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                      value={selectedNode.data?.startTime || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { startTime: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Duration (s)</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                      value={selectedNode.data?.duration || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { duration: parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              )}
              {selectedNode.type === 'splitter' && (
                <>
                  <div>
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
                        // Preserve existing weights if possible
                        for (let i = 0; i < Math.min(oldWeights.length, newNumPaths); i++) {
                          newWeights[i] = oldWeights[i];
                        }
                        updateNodeData(selectedNode.id, { numPaths: newNumPaths, weights: newWeights });
                      }}
                    />
                  </div>
                  {Array.from({ length: selectedNode.data?.numPaths || 2 }).map((_, i) => {
                    const weights = (selectedNode.data?.weights as number[]) || Array(selectedNode.data?.numPaths || 2).fill(10);
                    const weight = weights[i] || 10;
                    const totalWeight = weights.reduce((a: number, b: number) => a + b, 0) || 1;
                    const percentage = Math.round((weight / totalWeight) * 100);
                    
                    return (
                      <div key={`path-${i}`}>
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
              {selectedNode.type === 'randomizer' && (
                <>
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
            </div>
            <button
              onClick={() => selectNode(null)}
              className="w-full mt-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
            >
              Deselect
            </button>
          </div>
        </>
      )}

      {!selectedNode && (
        <>
          <div className="flex-1" />
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-3">Tip: Click nodes on canvas to edit. Click edges to delete.</p>
            <div className="bg-slate-800 rounded p-3 text-xs text-slate-300">
              <p className="font-semibold mb-2 text-slate-200">Building paths:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Start with Start node</li>
                <li>Add Track nodes</li>
                <li>Use Splitters to branch</li>
                <li>End with End nodes</li>
                <li>Click edges to delete</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
