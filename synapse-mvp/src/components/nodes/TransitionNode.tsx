import { Handle, Position } from '@xyflow/react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathStore } from '../../store';
import { useState } from 'react';

export default function TransitionNode({ data = {}, id }: any) {
  const { updateNodeData, currentPlayingNodeId } = usePathStore();
  const [isCollapsed, setIsCollapsed] = useState(data?.isCollapsed || false);
  const isPlaying = currentPlayingNodeId === id;

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    
    // Adjust position so node collapses upwards
    const currentHeight = isCollapsed ? 80 : 250;
    const newHeight = newCollapsed ? 250 : 80;
    const heightDiff = newHeight - currentHeight;
    
    updateNodeData(id, { 
      isCollapsed: newCollapsed,
      position: { ...data?.position, y: (data?.position?.y || 0) - heightDiff }
    });
  };

  const transitionType = data?.type || 'silence';
  const duration = data?.duration || 1;
  const fileName = data?.fileName || '';
  const videoId = data?.videoId || '';

  return (
    <div className={`bg-slate-800 border rounded-lg shadow-lg overflow-hidden w-64 ${isPlaying ? 'border-orange-500' : 'border-amber-600'}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-2 p-3 cursor-pointer ${isPlaying ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
            {isPlaying && <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </div>
          <strong className="text-sm text-slate-100 truncate">Transition</strong>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-3 pb-2">
        {transitionType === 'silence' ? (
          <p className="text-xs text-slate-400">Silence: {duration}s</p>
        ) : transitionType === 'audio' ? (
          <p className="text-xs text-slate-400">{data?.audioFile ? fileName : 'No file loaded'}</p>
        ) : transitionType === 'youtube' ? (
          <p className="text-xs text-slate-400">YouTube: {videoId || 'No video set'}</p>
        ) : (
          <p className="text-xs text-slate-400">Unknown type</p>
        )}
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 bg-slate-750 border-t border-slate-700">
          <p className="text-xs text-slate-300 mb-2">Type: {transitionType === 'silence' ? 'Silence' : transitionType === 'audio' ? 'Audio File' : 'YouTube Video'}</p>
          {transitionType === 'silence' && (
            <p className="text-xs text-slate-400">Duration: {duration} second{duration !== 1 ? 's' : ''}</p>
          )}
          {transitionType === 'audio' && data?.audioFile && (
            <p className="text-xs text-slate-400 break-all">{fileName}</p>
          )}
          {transitionType === 'youtube' && videoId && (
            <p className="text-xs text-slate-400 break-all">ID: {videoId}</p>
          )}
          <p className="text-xs text-slate-500 mt-2 italic">Edit in sidebar →</p>
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
