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
    updateNodeData(id, { isCollapsed: newCollapsed });
  };

  return (
    <div
      className={`synapse-node w-72 relative ${
        isPlaying ? 'border-[rgba(232,164,92,0.85)]' : ''
      }`}
    >
      <div className="synapse-node-header" onClick={toggleCollapse}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <div className="w-7 h-7 rounded-md grid place-items-center bg-[var(--accent-warm-dim)]">
              <Music className="w-3.5 h-3.5 text-[var(--accent-warm)]" />
            </div>
            {isPlaying && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent-warm)]" />
            )}
          </div>
          <strong
            className="text-sm text-[var(--text)] truncate tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {data?.songTitle || data?.label || 'Track'}
          </strong>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-[var(--text-faint)] flex-shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-[var(--text-faint)] flex-shrink-0" />
        )}
      </div>

      {isCollapsed && (
        <div className="px-3 py-2 space-y-0.5">
          {data?.artist ? (
            <p className="text-xs text-[var(--text-muted)] truncate m-0">{data.artist}</p>
          ) : null}
          <p className="text-[0.65rem] text-[var(--text-faint)] break-all m-0 font-mono">
            ID: {data?.videoId || 'Not set'}
          </p>
          <p className="text-[0.65rem] text-[var(--text-faint)] m-0 font-mono">
            Play ×{data?.playCount || 1}
          </p>
        </div>
      )}

      {!isCollapsed && (
        <div className="px-3 pb-3 pt-2 border-t border-[var(--border)] space-y-0.5">
          {data?.artist ? (
            <p className="text-xs text-[var(--text-muted)] truncate m-0">{data.artist}</p>
          ) : null}
          {data?.album ? (
            <p className="text-[0.65rem] text-[var(--text-faint)] truncate m-0">{data.album}</p>
          ) : null}
          <p className="text-[0.65rem] text-[var(--text-muted)] break-all m-0 font-mono">
            ID: {data?.videoId || 'Not set'}
          </p>
          <p className="text-[0.65rem] text-[var(--text-faint)] m-0 font-mono">
            Play ×{data?.playCount || 1}
          </p>
          <p className="text-[0.65rem] text-[var(--text-faint)] mt-2 m-0 italic">
            Edit in inspector →
          </p>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="synapse-handle" />
      <Handle type="source" position={Position.Right} className="synapse-handle" />
    </div>
  );
}
