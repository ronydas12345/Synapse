import { useEffect, useRef, type CSSProperties } from 'react';
import { GitBranch, Play, Pause } from 'lucide-react';
import DeckTransport from './DeckTransport';
import AudioVisualizer from './AudioVisualizer';
import type { ListenRow } from '../listenPath';

interface PlayingScreenProps {
  nowPlaying: { title: string; artist: string; album: string } | null;
  isPlaying: boolean;
  queueActive: boolean;
  currentTime: number;
  duration: number;
  statusMessage: string;
  queueLabel: string;
  pathHeading: string;
  rows: ListenRow[];
  vizAudio: HTMLAudioElement | null;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (seconds: number) => void;
  onJump: (nodeId: string) => void;
}

function PathRow({
  row,
  onJump,
}: {
  row: ListenRow;
  onJump: (nodeId: string) => void;
}) {
  if (row.kind === 'split') {
    return (
      <div className={`synapse-listen-split phase-${row.phase}${row.inside ? ' is-live' : ''}`}>
        <button
          type="button"
          className="synapse-listen-split-head"
          onClick={() => onJump(row.nodeId)}
        >
          <GitBranch className="w-4 h-4" />
          <span className="synapse-listen-split-kicker">Branch</span>
          <span>
            {row.title}
            {row.modeLabel ? ` · ${row.modeLabel}` : ''}
          </span>
        </button>
        <div className="synapse-listen-fork" aria-label="Branch options">
          {(row.options || []).map((opt) => (
            <div
              key={opt.nodeId}
              className={`synapse-listen-arm ${opt.chosen ? 'is-chosen' : 'is-alt'}`}
            >
              <button
                type="button"
                className={`synapse-listen-branch ${opt.chosen ? 'is-chosen' : 'is-alt'}`}
                onClick={() => onJump(opt.nodeId)}
              >
                <span className="synapse-listen-branch-arm" aria-hidden="true" />
                <span className="synapse-listen-branch-label">{opt.label}</span>
                <span className="synapse-listen-branch-detail">{opt.detail}</span>
                {opt.chosen ? (
                  <span className="synapse-listen-branch-live">This path</span>
                ) : null}
              </button>
              {!opt.chosen
                ? (opt.items && opt.items.length > 0 ? opt.items : []).map((item) => (
                    <button
                      key={item.nodeId}
                      type="button"
                      className="synapse-listen-alt-item"
                      onClick={() => onJump(item.nodeId)}
                    >
                      <span className="synapse-listen-item-title">{item.title}</span>
                      {item.subtitle ? (
                        <span className="synapse-listen-item-sub">{item.subtitle}</span>
                      ) : null}
                    </button>
                  ))
                : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`synapse-listen-item phase-${row.phase} ${row.phase === 'now' ? 'is-now' : ''} ${row.type === 'start' ? 'is-start' : ''}`}
      onClick={() => onJump(row.nodeId)}
    >
      {row.type === 'start' ? (
        <span className="synapse-listen-item-kind">Start</span>
      ) : null}
      <span className="synapse-listen-item-title">{row.title}</span>
      {row.subtitle ? (
        <span className="synapse-listen-item-sub">{row.subtitle}</span>
      ) : null}
    </button>
  );
}

export default function PlayingScreen({
  nowPlaying,
  isPlaying,
  queueActive,
  currentTime,
  duration,
  statusMessage,
  queueLabel,
  pathHeading,
  rows,
  vizAudio,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeekBy,
  onSeekTo,
  onJump,
}: PlayingScreenProps) {
  const nowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = nowRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [nowPlaying?.title, queueLabel]);

  return (
    <div className="synapse-listen-list">
      <div className="synapse-listen-live">
        <div className="synapse-listen-now">
          <p className="synapse-section-label">Now playing</p>
          <h2 className="synapse-listen-title">
            {nowPlaying?.title || (isPlaying ? 'Starting…' : 'Ready')}
          </h2>
          {nowPlaying ? (
            <>
              <p className={`synapse-listen-artist ${nowPlaying.artist ? '' : 'is-empty'}`}>
                {nowPlaying.artist || 'No artist'}
              </p>
              <p className={`synapse-listen-album ${nowPlaying.album ? '' : 'is-empty'}`}>
                {nowPlaying.album || 'No album'}
              </p>
            </>
          ) : null}
          {queueLabel ? <p className="synapse-deck-queue">{queueLabel}</p> : null}
          {statusMessage ? (
            <p className="synapse-deck-status">{statusMessage}</p>
          ) : null}
        </div>

        <button
          type="button"
          className={`synapse-listen-play ${isPlaying ? 'is-active' : ''}`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
        </button>

        <DeckTransport
          isPlaying={isPlaying}
          disabled={!queueActive && !isPlaying}
          currentTime={currentTime}
          duration={duration}
          showPlayButton={false}
          onTogglePlay={onTogglePlay}
          onPrevious={onPrevious}
          onNext={onNext}
          onSeekBy={onSeekBy}
          onSeekTo={onSeekTo}
        />

        <AudioVisualizer isPlaying={isPlaying} mediaElement={vizAudio} />
      </div>

      <div className="synapse-listen-paths">
        {rows.length > 0 ? (
          <section className="synapse-listen-path" aria-label="Playlist">
            <p className="synapse-section-label">{pathHeading}</p>
            <ol className="synapse-listen-rows synapse-listen-playlist">
              {rows.map((row, index) => {
                const isCurrent = row.kind === 'item' && row.phase === 'now';
                return (
                  <li
                    key={`${row.kind}-${row.nodeId}-${index}`}
                    className={[
                      isCurrent ? 'is-current' : '',
                      row.kind === 'split' && row.inside ? 'is-live-split' : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined}
                    style={
                      {
                        '--listen-depth': String(row.depth ?? 0),
                      } as CSSProperties
                    }
                    data-depth={row.depth ?? 0}
                    ref={isCurrent ? nowRef : undefined}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    {row.depth > 0 ? (
                      <span className="synapse-listen-guides" aria-hidden="true">
                        {Array.from({ length: row.depth }, (_, guide) => (
                          <span key={guide} className="synapse-listen-guide" />
                        ))}
                      </span>
                    ) : null}
                    <div className="synapse-listen-bar">
                      {isCurrent ? (
                        <span className="synapse-listen-playhead" aria-hidden="true" />
                      ) : null}
                      <PathRow row={row} onJump={onJump} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
          <p className="synapse-listen-empty">
            Connect tracks from Start in Studio, then Play. The full playlist
            appears here, with a marker on the song that is playing.
          </p>
        )}
      </div>
    </div>
  );
}
