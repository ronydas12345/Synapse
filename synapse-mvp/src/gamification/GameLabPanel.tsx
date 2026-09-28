import { useEffect, useState } from 'react';
import {
  loadGamificationState,
  staffAdjustTokens,
  staffGamificationStats,
  staffSetFlag,
  staffUpdateGame,
} from './api';
import { TOKEN_LABEL, type GameRecord, type GamificationState } from './types';
import GamePlay from './GamePlay';

const RELEASE = ['draft', 'internal', 'superadmin', 'staged', 'public', 'disabled', 'archived'];

export default function GameLabPanel() {
  const [state, setState] = useState<GamificationState | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<GameRecord | null>(null);
  const [uid, setUid] = useState('');
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('');

  async function reload() {
    const [next, numbers] = await Promise.all([
      loadGamificationState(),
      staffGamificationStats(),
    ]);
    setState(next);
    setStats(numbers);
    setError('');
  }

  useEffect(() => {
    void reload().catch((err) => {
      setError(err instanceof Error ? err.message : 'Game Lab could not load.');
    });
  }, []);

  if (preview) {
    return (
      <GamePlay
        game={preview}
        practice
        onExit={() => {
          setPreview(null);
          void reload().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <section className="synapse-staff-section">
      <h2>Game Lab</h2>
      <p className="synapse-settings-lead">
        Superadmin-only. Preview games, move release states, toggle flags, and
        adjust {TOKEN_LABEL.toLowerCase()} with a required reason. This is not
        the public Playground.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {message ? <p className="synapse-settings-lead">{message}</p> : null}
      {stats ? (
        <ul>
          <li>Playground users: {stats.playgroundUsers}</li>
          <li>Games today: {stats.gamesToday}</li>
          <li>Games this week: {stats.gamesWeek}</li>
          <li>Tokens earned: {stats.tokensEarned}</li>
          <li>Tokens spent: {stats.tokensSpent}</li>
          <li>Rewarded sessions: {stats.rewardedSessions}</li>
          <li>Practice sessions: {stats.practiceSessions}</li>
        </ul>
      ) : null}
      <h3>Flags</h3>
      {state
        ? Object.entries(state.flags).map(([id, enabled]) => (
            <label key={id} className="synapse-settings-field">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => {
                  void staffSetFlag(id, event.target.checked)
                    .then(() => reload())
                    .then(() => setMessage(`Updated ${id}.`))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Flag update failed.')
                    );
                }}
              />{' '}
              {id}
            </label>
          ))
        : null}
      <h3>Games</h3>
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>State</th>
              <th>Enabled</th>
              <th>Featured</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(state?.games || []).map((game) => (
              <tr key={game.id}>
                <td>{game.name}</td>
                <td>
                  <select
                    className="synapse-settings-input"
                    value={game.release_state}
                    onChange={(event) => {
                      void staffUpdateGame({
                        id: game.id,
                        enabled: game.enabled,
                        featured: game.featured,
                        maintenance: game.maintenance,
                        releaseState: event.target.value,
                        rewardBands: game.reward_bands,
                      })
                        .then(() => reload())
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : 'Update failed.')
                        );
                    }}
                  >
                    {RELEASE.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={game.enabled}
                    onChange={(event) => {
                      void staffUpdateGame({
                        id: game.id,
                        enabled: event.target.checked,
                        featured: game.featured,
                        maintenance: game.maintenance,
                        releaseState: String(game.release_state),
                        rewardBands: game.reward_bands,
                      }).then(() => reload());
                    }}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={game.featured}
                    onChange={(event) => {
                      void staffUpdateGame({
                        id: game.id,
                        enabled: game.enabled,
                        featured: event.target.checked,
                        maintenance: game.maintenance,
                        releaseState: String(game.release_state),
                        rewardBands: game.reward_bands,
                      }).then(() => reload());
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="synapse-btn synapse-btn-ghost"
                    onClick={() => setPreview(game)}
                  >
                    Preview
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Manual {TOKEN_LABEL} adjustment</h3>
      <label className="synapse-settings-field">
        Account uid
        <input className="synapse-settings-input" value={uid} onChange={(e) => setUid(e.target.value)} />
      </label>
      <label className="synapse-settings-field">
        Amount (negative to subtract)
        <input className="synapse-settings-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label className="synapse-settings-field">
        Reason
        <input className="synapse-settings-input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        onClick={() => {
          void staffAdjustTokens(uid.trim(), Number(amount), reason)
            .then(() => {
              setMessage('Adjustment recorded in the ledger.');
              setReason('');
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'Adjustment failed.'));
        }}
      >
        Record adjustment
      </button>
    </section>
  );
}
