import { extractYouTubeId, formatClock } from '../../playback';
import { getTrackDisplayMeta } from '../../trackMetadata';

export default function TrackYoutubeTab({
  data,
  onAutofill,
}: {
  data: Record<string, unknown> | undefined;
  onAutofill: () => void;
}) {
  const videoId = extractYouTubeId(String(data?.videoId || '')) || '';
  const meta = getTrackDisplayMeta(data);
  const duration = Number(data?.duration) || 0;
  const status = String(data?.metadataStatus || '');
  const watch = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '';
  const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

  return (
    <div className="space-y-3">
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="synapse-inspector-thumb"
          width={480}
          height={360}
        />
      ) : (
        <p className="text-xs text-[var(--text-faint)] m-0">
          Paste a YouTube URL in Settings to load a thumbnail and credits.
        </p>
      )}
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">Title</p>
        <p className="text-sm text-[var(--text)] m-0">{meta.title}</p>
      </div>
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">Artist</p>
        <p className={`text-sm m-0 ${meta.artist ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}`}>
          {meta.artist || 'Not set'}
        </p>
      </div>
      <div>
        <p className="text-xs text-[var(--text-faint)] m-0 mb-1">Album</p>
        <p className={`text-sm m-0 ${meta.album ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}`}>
          {meta.album || 'Not set'}
        </p>
      </div>
      {duration > 0 ? (
        <p className="text-xs text-[var(--text-muted)] m-0">Duration {formatClock(duration)}</p>
      ) : null}
      {videoId ? (
        <p className="text-[0.65rem] text-[var(--text-faint)] font-mono m-0 break-all">
          {videoId}
        </p>
      ) : null}
      {watch ? (
        <a
          className="synapse-btn synapse-btn-ghost text-xs inline-flex"
          href={watch}
          target="_blank"
          rel="noreferrer"
        >
          Open on YouTube
        </a>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost text-xs"
          disabled={!videoId || status === 'loading'}
          onClick={onAutofill}
        >
          Autofill credits
        </button>
        <span className="text-[0.65rem] text-[var(--text-faint)] font-mono">
          {status === 'loading'
            ? 'Looking up…'
            : status === 'ready'
              ? 'Filled from video'
              : status === 'error'
                ? 'Lookup failed'
                : ''}
        </span>
      </div>
    </div>
  );
}
