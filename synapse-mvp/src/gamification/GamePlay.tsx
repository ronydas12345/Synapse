import { useCallback, useRef, useState } from 'react';
import { documentPrefersReducedMotion } from '../settings/motion';
import { GAME_COMPONENTS } from './games';
import { startGameSession, submitGameResult } from './api';
import { TOKEN_LABEL } from './types';
import type { GameRecord, GameSessionResult } from './types';
import { rewardRange } from './rewards';

export default function GamePlay({
  game,
  practice,
  onExit,
}: {
  game: GameRecord;
  practice: boolean;
  onExit: (result: GameSessionResult | null) => void;
}) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'busy' | 'done'>('ready');
  const [error, setError] = useState('');
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const sessionRef = useRef('');
  const submitted = useRef(false);
  const reduced = documentPrefersReducedMotion();
  const range = rewardRange(game.reward_bands);

  const finish = useCallback(async (score: number) => {
    if (submitted.current || !sessionRef.current) return;
    submitted.current = true;
    setPhase('busy');
    try {
      const next = await submitGameResult(sessionRef.current, score);
      setResult(next);
      setPhase('done');
    } catch (err) {
      submitted.current = false;
      setError(err instanceof Error ? err.message : 'Could not submit that result.');
      setPhase('done');
    }
  }, []);

  async function start() {
    setError('');
    submitted.current = false;
    setPhase('busy');
    try {
      const id = await startGameSession(game.id, practice);
      sessionRef.current = id;
      setPhase('play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start that game.');
      setPhase('ready');
    }
  }

  const body = GAME_COMPONENTS[game.id];

  return (
    <section className="synapse-playground-play" aria-live="polite">
      <button type="button" className="synapse-btn synapse-btn-ghost" onClick={() => onExit(result)}>
        Back to Playground
      </button>
      <h2>{game.name}</h2>
      <p className="synapse-settings-lead">{game.description}</p>
      {practice ? (
        <p className="synapse-settings-hint">Practice — no {TOKEN_LABEL.toLowerCase()} will be awarded.</p>
      ) : (
        <p className="synapse-settings-hint">
          Typical reward {range.min}–{range.max} {TOKEN_LABEL.toLowerCase()} if you still have daily room.
        </p>
      )}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {phase === 'ready' ? (
        <button type="button" className="synapse-btn synapse-btn-play" onClick={() => void start()}>
          Start
        </button>
      ) : null}
      {phase === 'busy' ? <p>Working…</p> : null}
      {phase === 'play' && body ? (
        body({
          practice,
          reducedMotion: reduced,
          onComplete: (score) => void finish(score),
        })
      ) : null}
      {phase === 'play' && !body ? (
        <p className="synapse-settings-error">This game failed to load.</p>
      ) : null}
      {phase === 'done' && result ? (
        <div className="synapse-game-result">
          <p>
            Score {result.score ?? '—'}
            {result.status === 'invalid'
              ? '. Result could not be verified.'
              : `. ${result.rewardTokens} ${TOKEN_LABEL.toLowerCase()} awarded.`}
          </p>
          {result.denyReason === 'cap' || result.denyReason === 'cap_partial' ? (
            <p className="synapse-settings-hint">
              Daily game rewards LIMIT REACHED. You can still play for practice.
            </p>
          ) : null}
          {result.denyReason === 'practice' ? (
            <p className="synapse-settings-hint">Practice session — no reward.</p>
          ) : null}
          {result.message ? <p>{result.message}</p> : null}
          <button type="button" className="synapse-btn synapse-btn-play" onClick={() => onExit(result)}>
            Done
          </button>
        </div>
      ) : null}
    </section>
  );
}
