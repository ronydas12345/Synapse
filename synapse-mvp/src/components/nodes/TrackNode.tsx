import { Handle, Position } from '@xyflow/react';
import { Music, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathStore } from '../../store';
import { useState } from 'react';

export default function TrackNode({ data = {}, id }: any) {
  const { updateNodeData, currentPlayingNodeId } = usePathStore();
  const [isCollapsed, setIsCollapsed] = useState(data?.isCollapsed || false);
  const isPlaying = currentPlayingNodeId === id;

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    
    // Adjust position so node collapses upwards
    const currentHeight = isCollapsed ? 140 : 500; // rough heights
    const newHeight = newCollapsed ? 500 : 140;
    const heightDiff = newHeight - currentHeight;
    
    // Update node data with new position
    updateNodeData(id, { 
      isCollapsed: newCollapsed,
      position: { ...data?.position, y: (data?.position?.y || 0) - heightDiff }
    });
  };

  return (
    <div className={`bg-slate-800 border rounded-lg shadow-lg overflow-hidden w-72 ${isPlaying ? 'border-orange-500' : 'border-slate-600'}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-2 p-3 cursor-pointer ${isPlaying ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          onClick={toggleCollapse}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <Music className="w-4 h-4 text-amber-500 flex-shrink-0" />
              {isPlaying && <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />}
            </div>
            <strong className="text-sm text-slate-100 truncate">Track</strong>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </div>

        {/* Info - only show when collapsed */}
        {isCollapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-slate-400 break-all">ID: {data?.videoId || 'Not set'}</p>
            <p className="text-xs text-slate-400">Duration: {data?.duration || 0}s</p>
            <p className="text-xs text-slate-400">Play Count: {data?.playCount || 1}</p>
          </div>
        )}

        {/* Expanded Content */}
        {!isCollapsed && (
          <div className="px-3 pb-3 bg-slate-750 border-t border-slate-700">
            <p className="text-xs text-slate-300 break-all">ID: {data?.videoId || 'Not set'}</p>
            <p className="text-xs text-slate-400">Duration: {data?.duration || 0}s</p>
            <p className="text-xs text-slate-400">Play Count: {data?.playCount || 1}</p>
            <p className="text-xs text-slate-500 mt-2 italic">Edit settings in sidebar →</p>
          </div>
        )}

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    );
}