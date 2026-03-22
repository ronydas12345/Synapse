import { Handle, Position } from '@xyflow/react';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function SplitterNode({ data = {}, id }: any) {
  const { updateNodeData } = usePathStore();
  const [isCollapsed, setIsCollapsed] = useState(data?.isCollapsed || false);

  const numPaths = data?.numPaths || 2;
  const weights = (data?.weights as number[]) || Array(numPaths).fill(10);

  // Calculate percentages from weights
  const totalWeight = weights.reduce((a: number, b: number) => a + b, 0) || 1;
  const percentages = weights.map((w: number) => Math.round((w / totalWeight) * 100));

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    updateNodeData(id, { isCollapsed: newCollapsed });
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    const newWeights = [...weights];
    newWeights[index] = Math.max(1, newWeight);
    updateNodeData(id, { weights: newWeights });
  };

  return (
    <>
      <style>{spinnerHideStyles}</style>
      <div className="bg-slate-800 border border-indigo-500 rounded-lg shadow-lg overflow-hidden w-56">
        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 bg-slate-700 p-3 cursor-pointer hover:bg-slate-600"
          onClick={toggleCollapse}
        >
          <div className="flex items-center gap-2 flex-1">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <strong className="text-sm text-slate-100">Splitter ({numPaths})</strong>
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
            <div className="space-y-2">
              {Array.from({ length: numPaths }).map((_, i) => {
                const weight = weights[i] || 10;
                const percentage = percentages[i];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-slate-600 rounded border-l-2 border-indigo-400"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-200 font-semibold">
                        Path {String.fromCharCode(65 + i)}
                      </div>
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
                    </div>
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