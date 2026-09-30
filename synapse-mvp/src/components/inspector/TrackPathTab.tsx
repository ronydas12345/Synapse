import { usePathStore } from '../../store';
import { neighborLabels, queuePosition, sequencesContaining } from '../../nodes/pathContext';

export default function TrackPathTab({ nodeId }: { nodeId: string }) {
  const nodes = usePathStore((s) => s.nodes);
  const edges = usePathStore((s) => s.edges);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const playbackQueue = usePathStore((s) => s.playbackQueue);
  const currentTrackIndex = usePathStore((s) => s.currentTrackIndex);

  const playlist = pathSummaries.find((path) => path.id === activePathId);
  const sequences = sequencesContaining(nodes, nodeId);
  const neighbors = neighborLabels(nodes, edges, nodeId);
  const queued = queuePosition(playbackQueue, nodeId);

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">Playlist</p>
        <p className="m-0 text-[var(--text)]">{playlist?.name || 'Untitled'}</p>
      </div>
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">Sequences</p>
        {sequences.length === 0 ? (
          <p className="m-0 text-xs text-[var(--text-muted)]">
            This track is on the canvas, not inside a Sequence or Randomizer.
          </p>
        ) : (
          <ul className="m-0 pl-4 space-y-1">
            {sequences.map((seq) => (
              <li key={seq.id}>
                <button
                  type="button"
                  className="synapse-inspector-jump"
                  onClick={() => usePathStore.getState().selectNode(seq.id)}
                >
                  {seq.name} · {seq.mode === 'randomizer' ? 'Randomizer' : 'Sequence'} ·{' '}
                  {seq.index + 1} of {seq.total}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">On this path</p>
        <p className="m-0 text-xs text-[var(--text-muted)]">
          In: {neighbors.incoming.length ? neighbors.incoming.join(', ') : 'nothing'}
        </p>
        <p className="m-0 text-xs text-[var(--text-muted)]">
          Out: {neighbors.outgoing.length ? neighbors.outgoing.join(', ') : 'nothing'}
        </p>
      </div>
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">Playback queue</p>
        {queued ? (
          <p className="m-0 text-xs text-[var(--text-muted)]">
            Item {queued.index + 1} of {queued.total}
            {queued.index === currentTrackIndex ? ' · now playing' : ''}
          </p>
        ) : (
          <p className="m-0 text-xs text-[var(--text-muted)]">Not in the current queue.</p>
        )}
      </div>
    </div>
  );
}
