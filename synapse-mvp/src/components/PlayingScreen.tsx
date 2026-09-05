import { useEffect, useRef } from 'react';
import { GitBranch, LogOut, Play, Pause } from 'lucide-react';
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
      <div className={`synapse-listen-split phase-${row.phase}`}>
        <button
          type="button"
          className="synapse-listen-split-head"
          onClick={() => onJump(row.nodeId)}
        >
          <GitBranch className="w-4 h-4" />
          <span className="synapse-listen-split-kicker">
            {row.inside ? 'On branch' : 'Branch'}
          </span>
          <span>
            {row.title}
            {row.modeLabel ? ` · ${row.modeLabel}` : ''}
          </span>
        </button>
        {row.inside ? (
          <button
            type="button"
            className="synapse-listen-leave"
            disabled={!row.leaveTargetId}
            title={
              row.leaveTargetId
                ? 'Skip the rest of this branch and continue after it'
                : 'This branch has no path after it'
            }
            onClick={() => {
              if (row.leaveTargetId) onJump(row.leaveTargetId);
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave branch
          </button>
        ) : null}
        <div className="synapse-listen-fork" aria-label="Branch options">
          {(row.options || []).map((opt) => (
            <button
              key={opt.nodeId}
              type="button"
              className={`synapse-listen-branch ${opt.chosen ? 'is-chosen' : 'is-alt'}`}
              onClick={() => onJump(opt.nodeId)}
            >
              <span className="synapse-listen-branch-arm" aria-hidden="true" />
              <span className="synapse-listen-branch-label">{opt.label}</span>
              <span className="synapse-listen-branch-detail">{opt.detail}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const kicker =
    row.type === 'start'
      ? 'Start'
      : row.phase === 'played'
        ? 'Played'
        : row.phase === 'now'
          ? 'Now'
          : 'Next';

  return (
    <button
      type="button"
      className={`synapse-listen-item phase-${row.phase} ${row.phase === 'now' ? 'is-now' : ''} ${row.type === 'start' ? 'is-start' : ''}`}
      onClick={() => onJump(row.nodeId)}
    >
      <span className="synapse-listen-item-kind">{kicker}</span>
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
  const startRows = rows.filter((r) => r.type === 'start');
  const liveSplits = rows.filter((r) => r.kind === 'split' && r.inside);
  const liveSplitIds = new Set(liveSplits.map((r) => r.nodeId));
  const played = rows.filter(
    (r) =>
      r.phase === 'played' &&
      r.type !== 'start' &&
      !(r.kind === 'split' && liveSplitIds.has(r.nodeId))
  );
  const rest = [
    ...liveSplits.filter((r) => r.phase === 'played'),
    ...rows.filter((r) => r.phase !== 'played' && r.type !== 'start'),
  ];

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
        {startRows.length > 0 ? (
          <section className="synapse-listen-path" aria-label="Go to Start">
            <ol className="synapse-listen-rows">
              {startRows.map((row) => (
                <li key={`start-${row.nodeId}`}>
                  <PathRow row={row} onJump={onJump} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {played.length > 0 ? (
          <section className="synapse-listen-path" aria-label="Played path">
            <p className="synapse-section-label">Played</p>
            <ol className="synapse-listen-rows synapse-listen-timeline">
              {played.map((row, index) => (
                <li
                  key={`played-${row.kind}-${row.nodeId}-${index}`}
                  ref={row.phase === 'now' ? nowRef : undefined}
                >
                  <PathRow row={row} onJump={onJump} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section className="synapse-listen-path" aria-label="Current and upcoming path">
            <p className="synapse-section-label">{pathHeading}</p>
            <ol className="synapse-listen-rows synapse-listen-timeline">
              {rest.map((row, index) => (
                <li
                  key={`rest-${row.kind}-${row.nodeId}-${index}`}
                  ref={row.phase === 'now' ? nowRef : undefined}
                >
                  <PathRow row={row} onJump={onJump} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {played.length === 0 && rest.length === 0 ? (
          <p className="synapse-listen-empty">
            Connect tracks from Start in Studio, then Play. Splits appear here so
            you can jump to a branch without opening the graph.
          </p>
        ) : null}
      </div>
    </div>
  );
}
