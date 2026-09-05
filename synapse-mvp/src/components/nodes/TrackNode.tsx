import { Handle, Position } from '@xyflow/react';
import { Music } from 'lucide-react';
import { usePathStore } from '../../store';
import { getTrackDisplayMeta } from '../../trackMetadata';

function CreditLine({
  value,
  emptyLabel,
  className,
}: {
  value: string;
  emptyLabel: string;
  className: string;
}) {
  return (
    <p className={`${className} truncate m-0 ${value ? '' : 'synapse-track-credit-empty'}`}>
      {value || emptyLabel}
    </p>
  );
}

export default function TrackNode({ data = {}, id }: any) {
  const { currentPlayingNodeId } = usePathStore();
  const isPlaying = currentPlayingNodeId === id;
  const meta = getTrackDisplayMeta(data);

  return (
    <div
      className={`synapse-node w-72 relative is-track ${
        isPlaying ? 'is-playing' : ''
      }`}
    >
      <div className="synapse-node-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <div className="w-7 h-7 rounded-md grid place-items-center bg-[var(--accent-warm-dim)]">
              <Music className="w-3.5 h-3.5 text-[var(--accent-warm)]" />
            </div>
            {isPlaying && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent-warm)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <strong
              className="block text-sm text-[var(--text)] truncate tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {meta.title}
            </strong>
            {isPlaying ? (
              <span className="synapse-now-playing-pill">Now playing</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2 space-y-0.5 border-t border-[var(--border)]">
        <CreditLine
          value={meta.artist}
          emptyLabel="No artist"
          className="text-xs text-[var(--text-muted)]"
        />
        <CreditLine
          value={meta.album}
          emptyLabel="No album"
          className="text-[0.65rem] text-[var(--text-faint)]"
        />
        <p className="text-[0.65rem] text-[var(--text-faint)] break-all m-0 font-mono">
          ID: {data?.videoId || 'Not set'}
        </p>
        <p className="text-[0.65rem] text-[var(--text-faint)] m-0 font-mono">
          Play ×{data?.playCount || 1}
        </p>
      </div>

      <Handle type="target" position={Position.Left} className="synapse-handle" aria-label="Connect into Track" />
      <Handle type="source" position={Position.Right} className="synapse-handle" aria-label="Connect from Track" />
    </div>
  );
}
