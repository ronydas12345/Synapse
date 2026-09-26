import { useEffect, useMemo, useState } from 'react';
import { AppLink } from '../app/AppLink';
import { claimDailyReward, loadGamificationState } from './api';
import GamePlay from './GamePlay';
import { GAME_CATEGORIES } from './games';
import { rewardRange } from './rewards';
import { TOKEN_LABEL, type GameRecord, type GamificationState } from './types';

export default function PlaygroundPage() {
  const [state, setState] = useState<GamificationState | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState<{ game: GameRecord; practice: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const next = await loadGamificationState();
    setState(next);
    setError('');
  }

  useEffect(() => {
    void reload().catch((err) => {
      setError(err instanceof Error ? err.message : 'Playground could not load.');
    });
  }, []);

  const featured = useMemo(
    () => state?.games.find((game) => game.featured && !game.maintenance) || state?.games[0],
    [state]
  );
  const dailyCap = state?.config.dailyGameTokenCap ?? 200;
  const weeklyCap = state?.config.weeklyGameTokenCap ?? 800;
  const schedule = state?.config.dailyRewardSchedule || [10, 15, 20, 25, 30, 35, 50];
  const nextDaily = schedule[Math.min(state?.wallet.current_streak ?? 0, schedule.length - 1)] ?? 10;
  const capReached =
    (state?.wallet.daily_game_tokens ?? 0) >= dailyCap ||
    (state?.wallet.weekly_game_tokens ?? 0) >= weeklyCap;
  const playgroundOn = state?.flags.playgroundEnabled !== false && state?.flags.gamificationEnabled !== false;

  if (active) {
    return (
      <GamePlay
        game={active.game}
        practice={active.practice || capReached}
        onExit={() => {
          setActive(null);
          void reload().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <main id="workspace-main" className="synapse-settings synapse-playground">
      <h1>Playground</h1>
      <p className="synapse-settings-lead">
        Short skill games on the side of Music Paths. {TOKEN_LABEL} are virtual
        and have no cash value. You cannot wager, cash out, or buy chance rolls.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {!playgroundOn ? (
        <p className="synapse-settings-lead">Playground is turned off right now.</p>
      ) : null}
      {state ? (
        <>
          <section className="synapse-profile-section">
            <h2>Your {TOKEN_LABEL}</h2>
            <p className="synapse-token-balance">{state.wallet.token_balance.toLocaleString()}</p>
            <p className="synapse-settings-hint">
              Lifetime earned {state.wallet.lifetime_earned.toLocaleString()} · daily game
              rewards {state.wallet.daily_game_tokens}/{dailyCap} · weekly{' '}
              {state.wallet.weekly_game_tokens}/{weeklyCap}
            </p>
            {capReached ? (
              <p className="synapse-settings-hint">
                Daily game rewards LIMIT REACHED. You can still play for practice.
              </p>
            ) : null}
          </section>
          {state.flags.dailyRewardsEnabled !== false ? (
            <section className="synapse-profile-section">
              <h2>Daily reward</h2>
              <p>
                Streak {state.wallet.current_streak} · next {nextDaily} {TOKEN_LABEL.toLowerCase()}
              </p>
              <button
                type="button"
                className="synapse-btn synapse-btn-play"
                disabled={busy || state.dailyClaimed}
                onClick={() => {
                  setBusy(true);
                  void claimDailyReward()
                    .then(() => reload())
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Could not claim.')
                    )
                    .finally(() => setBusy(false));
                }}
              >
                {state.dailyClaimed ? 'Claimed today' : 'Claim daily reward'}
              </button>
            </section>
          ) : null}
          {featured ? (
            <section className="synapse-profile-section">
              <h2>Featured</h2>
              <GameCard
                game={featured}
                capReached={capReached}
                onPlay={(practice) => setActive({ game: featured, practice })}
              />
            </section>
          ) : null}
          <section className="synapse-profile-section">
            <h2>Games</h2>
            <div className="synapse-game-cards">
              {(state.games || []).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  capReached={capReached}
                  onPlay={(practice) => setActive({ game, practice })}
                />
              ))}
            </div>
          </section>
          {state.flags.eventsEnabled ? (
            <section className="synapse-profile-section">
              <h2>Events</h2>
              <p className="synapse-settings-lead">No live events right now.</p>
            </section>
          ) : null}
          {state.flags.weeklyChallengesEnabled ? (
            <section className="synapse-profile-section">
              <h2>Challenges</h2>
              <p className="synapse-settings-lead">Weekly challenges are not open yet.</p>
            </section>
          ) : null}
          <section className="synapse-profile-section">
            <h2>Recently played</h2>
            {state.recent.length === 0 ? (
              <p className="synapse-settings-lead">No sessions yet.</p>
            ) : (
              <ul>
                {state.recent.map((row) => (
                  <li key={row.id}>
                    {row.game_id} · {row.status}
                    {row.practice ? ' · practice' : ''} · {row.reward_tokens} {TOKEN_LABEL.toLowerCase()}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="synapse-settings-hint">
            Badges from games show on your <AppLink to="profile">profile</AppLink>.
          </p>
        </>
      ) : null}
    </main>
  );
}

function GameCard({
  game,
  capReached,
  onPlay,
}: {
  game: GameRecord;
  capReached: boolean;
  onPlay: (practice: boolean) => void;
}) {
  const range = rewardRange(game.reward_bands);
  const locked = game.maintenance || !game.enabled;
  return (
    <article className="synapse-game-card">
      <p className="synapse-mkt-status">{GAME_CATEGORIES[game.id] || game.category}</p>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <p className="synapse-mkt-tags">
        About {game.estimated_seconds}s · up to {range.max} {TOKEN_LABEL.toLowerCase()}
        {capReached ? ' · practice only' : ''}
        {locked ? ' · unavailable' : ''}
      </p>
      <div className="synapse-theme-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-play"
          disabled={locked}
          onClick={() => onPlay(capReached)}
        >
          {capReached ? 'Practice' : 'Play'}
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={locked}
          onClick={() => onPlay(true)}
        >
          Practice
        </button>
      </div>
    </article>
  );
}
