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
    updateNodeData(id, { isCollapsed: newCollapsed });
  };

  const transitionType = data?.type || 'silence';
  const duration = data?.duration || 1;
  const fileName = data?.fileName || '';
  const videoId = data?.videoId || '';

  return (
    <div className={`synapse-node w-64 overflow-hidden ${isPlaying ? 'border-[rgba(232,164,92,0.85)]' : 'border-[rgba(232,164,92,0.4)]'}`}>
      {/* Header */}
      <div
        className="synapse-node-header"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <ArrowRight className="w-4 h-4 text-[var(--accent-warm)] flex-shrink-0" />
            {isPlaying && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-warm)]" />}
          </div>
          <strong className="text-sm text-[var(--text)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
            Transition
          </strong>
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
          <p className="text-xs text-slate-500 mt-2 italic">Edit in inspector →</p>
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
