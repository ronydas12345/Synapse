import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatClock } from '../playback';

const SEEK_STEPS = [-10, -5, 5, 10] as const;

interface DeckTransportProps {
  isPlaying: boolean;
  disabled: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (seconds: number) => void;
}

export default function DeckTransport({
  isPlaying,
  disabled,
  currentTime,
  duration,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeekBy,
  onSeekTo,
}: DeckTransportProps) {
  const max = duration > 0 ? duration : 0;

  return (
    <div className="synapse-transport-deck">
      <div className="synapse-transport-row">
        <button
          type="button"
          className="synapse-ctrl"
          title="Previous"
          aria-label="Previous track"
          disabled={disabled}
          onClick={onPrevious}
        >
          <SkipBack className="w-4 h-4" />
        </button>
        {SEEK_STEPS.filter((n) => n < 0).map((delta) => (
          <button
            key={delta}
            type="button"
            className="synapse-ctrl synapse-ctrl-seek"
            title={`Back ${Math.abs(delta)} seconds`}
            aria-label={`Back ${Math.abs(delta)} seconds`}
            disabled={disabled}
            onClick={() => onSeekBy(delta)}
          >
            {delta}
          </button>
        ))}
        <button
          type="button"
          className={`synapse-ctrl synapse-ctrl-play ${isPlaying ? 'is-active' : ''}`}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        {SEEK_STEPS.filter((n) => n > 0).map((delta) => (
          <button
            key={delta}
            type="button"
            className="synapse-ctrl synapse-ctrl-seek"
            title={`Forward ${delta} seconds`}
            aria-label={`Forward ${delta} seconds`}
            disabled={disabled}
            onClick={() => onSeekBy(delta)}
          >
            +{delta}
          </button>
        ))}
        <button
          type="button"
          className="synapse-ctrl"
          title="Next"
          aria-label="Next track"
          disabled={disabled}
          onClick={onNext}
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
      <div className="synapse-transport-progress">
        <span className="synapse-clock">{formatClock(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={max || 1}
          step={0.25}
          value={Math.min(currentTime, max || 0)}
          disabled={disabled || max <= 0}
          aria-label="Seek"
          onChange={(e) => onSeekTo(Number(e.target.value))}
        />
        <span className="synapse-clock">{formatClock(duration)}</span>
      </div>
    </div>
  );
}
