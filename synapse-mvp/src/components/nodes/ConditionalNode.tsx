import { Handle, Position } from '@xyflow/react';
import { GitBranch, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathStore } from '../../store';
import { useState, memo } from 'react';

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

function ConditionalNode({ data = {}, id }: any) {
  const { updateNodeData, currentPlayingNodeId } = usePathStore();
  const [isCollapsed, setIsCollapsed] = useState(data?.isCollapsed || false);
  const isPlaying = currentPlayingNodeId === id;

  console.log('ConditionalNode render:', {
    id,
    numPaths: data?.numPaths,
    mode: data?.mode,
    isCollapsed,
    isPlaying,
    weights: data?.weights,
  });

  const numPaths = data?.numPaths || 2;
  const weights = (data?.weights as number[]) || Array(numPaths).fill(10);
  const mode = (data?.mode as string) || 'random'; // 'random' or 'timeRange'
  const pathTimeRanges = (data?.pathTimeRanges as Array<Array<{start: number, end: number}>>) || 
    Array(numPaths).fill(null).map(() => [{ start: 0, end: 23 }]);

  // Calculate percentages from weights
  const totalWeight = weights.reduce((a: number, b: number) => a + b, 0) || 1;
  const percentages = weights.map((w: number) => Math.round((w / totalWeight) * 100));

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    console.log('Toggling collapse on node', id, 'from', isCollapsed, 'to', newCollapsed);
    setIsCollapsed(newCollapsed);
    
    // Adjust position so node collapses upwards
    const currentHeight = isCollapsed ? 80 : 300; // rough heights
    const newHeight = newCollapsed ? 300 : 80;
    const heightDiff = newHeight - currentHeight;
    
    // Update node data with new position
    updateNodeData(id, { 
      isCollapsed: newCollapsed,
      position: { ...data?.position, y: (data?.position?.y || 0) - heightDiff }
    });
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    console.log('Weight change on node', id, 'path', index, 'to', newWeight);
    const newWeights = [...weights];
    newWeights[index] = Math.max(1, newWeight);
    updateNodeData(id, { weights: newWeights });
  };

  const getBorderColor = () => {
    if (isPlaying) return 'border-orange-500';
    return mode === 'timeRange' ? 'border-green-500' : 'border-indigo-500';
  };

  const getIconColor = () => {
    return mode === 'timeRange' ? 'text-green-400' : 'text-indigo-400';
  };

  return (
    <>
      <style>{spinnerHideStyles}</style>
      <div className={`bg-slate-800 border rounded-lg shadow-lg overflow-hidden w-56 ${getBorderColor()}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-2 p-3 cursor-pointer ${isPlaying ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          onClick={toggleCollapse}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              {mode === 'timeOfDay' ? (
                <Clock className={`w-4 h-4 ${getIconColor()}`} />
              ) : (
                <GitBranch className={`w-4 h-4 ${getIconColor()}`} />
              )}
              {isPlaying && <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />}
            </div>
            <strong className="text-sm text-slate-100">
              {mode === 'timeRange' ? 'Conditional (Time)' : 'Conditional'}
            </strong>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateNodeData(id, { mode: mode === 'random' ? 'timeRange' : 'random' });
            }}
            className={`text-xs px-2 py-1 rounded border transition ${
              mode === 'timeRange'
                ? 'bg-green-600 border-green-400 text-green-100'
                : 'bg-indigo-600 border-indigo-400 text-indigo-100'
            }`}
            title={`Switch to ${mode === 'random' ? 'Time Range' : 'Random'} mode`}
          >
            {mode === 'timeRange' ? '🕐' : '🎲'}
          </button>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Expanded Content */}
        {!isCollapsed && (
          <div className="p-3 space-y-2 bg-slate-750">
            <div className="space-y-2">
              {Array.from({ length: numPaths }).map((_, i) => {
                const weight = weights[i] || 10;
                const percentage = percentages[i];
                const timeRanges = pathTimeRanges[i] || [{ start: 0, end: 23 }];
                const pathLabel = `Path ${String.fromCharCode(65 + i)}`;
                return (
                  <div
                    key={i}
                    className={`flex flex-col gap-2 p-2 bg-slate-600 rounded border-l-2 ${mode === 'timeRange' ? 'border-green-400' : 'border-indigo-400'}`}
                  >
                    <div className="text-xs text-slate-200 font-semibold">
                      {pathLabel}
                    </div>
                    {mode === 'random' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={weight}
                          onChange={(e) => handleWeightChange(i, parseInt(e.target.value) || 1)}
                          className="hide-spinners w-8 text-xs px-1 py-0 bg-slate-500 border border-slate-400 rounded text-slate-100 text-center"
                        />
                        <span className="text-xs text-slate-400">({percentage}%)</span>
                      </div>
                    )}
                    {mode === 'timeRange' && (
                      <div className="text-xs text-slate-300 bg-slate-500 p-1 rounded">
                        {timeRanges.length > 0 ? (
                          <>
                            {timeRanges.map((range, idx) => (
                              <div key={idx} className="text-slate-200">
                                {range.start.toString().padStart(2, '0')}:00 - {range.end.toString().padStart(2, '0')}:00
                              </div>
                            ))}
                          </>
                        ) : (
                          <div>No time ranges set</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Handle type="target" position={Position.Left} />
        {Array.from({ length: numPaths }).map((_, i) => {
          // When collapsed, center all handles; when expanded, space them out
          const topPosition = isCollapsed 
            ? '50%' 
            : `${20 + i * (Math.max(60 / numPaths, 15))}px`;
          
          return (
            <Handle
              key={`path-${i}`}
              type="source"
              position={Position.Right}
              id={String.fromCharCode(65 + i)}
              style={{ 
                top: topPosition,
                ...(isCollapsed && { transform: 'translateY(-50%)' })
              }}
            />
          );
        })}
      </div>
    </>
  );
}

export default memo(ConditionalNode);