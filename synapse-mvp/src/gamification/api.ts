import { supabase, throwIfError } from '../supabase/client';
import { parseBands } from './rewards';
import type {
  GameRecord,
  GameSessionResult,
  GamificationState,
  Wallet,
} from './types';

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function bool(value: unknown): boolean {
  return value === true;
}

function mapGame(raw: Record<string, unknown>): GameRecord {
  return {
    id: str(raw.id),
    name: str(raw.name),
    description: str(raw.description),
    category: str(raw.category),
    release_state: str(raw.release_state) || 'public',
    enabled: raw.enabled !== false,
    featured: bool(raw.featured),
    maintenance: bool(raw.maintenance),
    estimated_seconds: num(raw.estimated_seconds) || 30,
    min_duration_ms: num(raw.min_duration_ms) || 800,
    reward_bands: parseBands(raw.reward_bands),
    sort_order: num(raw.sort_order),
  };
}

function mapWallet(raw: Record<string, unknown> | null): Wallet {
  const row = raw || {};
  return {
    uid: str(row.uid),
    token_balance: num(row.token_balance),
    lifetime_earned: num(row.lifetime_earned),
    lifetime_spent: num(row.lifetime_spent),
    daily_game_tokens: num(row.daily_game_tokens),
    weekly_game_tokens: num(row.weekly_game_tokens),
    current_streak: num(row.current_streak),
    longest_streak: num(row.longest_streak),
    last_daily_claim: typeof row.last_daily_claim === 'string' ? row.last_daily_claim : null,
  };
}

export async function loadGamificationState(): Promise<GamificationState> {
  const { data, error } = await supabase.rpc('get_gamification_state');
  if (error && /does not exist|schema cache/i.test(error.message)) {
    throw new Error('Playground is not available yet.');
  }
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  const flags =
    row.flags && typeof row.flags === 'object'
      ? (row.flags as Record<string, boolean>)
      : {};
  const config =
    row.config && typeof row.config === 'object'
      ? (row.config as GamificationState['config'])
      : {};
  const games = Array.isArray(row.games)
    ? (row.games as Record<string, unknown>[]).map(mapGame)
    : [];
  const recent = Array.isArray(row.recent)
    ? (row.recent as Record<string, unknown>[]).map((item) => ({
        id: str(item.id),
        game_id: str(item.game_id),
        practice: bool(item.practice),
        status: str(item.status),
        score: typeof item.score === 'number' ? item.score : null,
        reward_tokens: num(item.reward_tokens),
        deny_reason: str(item.deny_reason),
        started_at: str(item.started_at),
      }))
    : [];
  return {
    wallet: mapWallet((row.wallet as Record<string, unknown>) || null),
    config,
    flags,
    games,
    recent,
    dailyClaimed: bool(row.dailyClaimed),
    isSuperadmin: bool(row.isSuperadmin),
  };
}

export async function startGameSession(
  gameId: string,
  practice: boolean
): Promise<string> {
  const { data, error } = await supabase.rpc('start_game_session', {
    p_game_id: gameId,
    p_practice: practice,
  });
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  const id = str(row.sessionId);
  if (!id) throw new Error('Could not start that game.');
  return id;
}

export async function submitGameResult(
  sessionId: string,
  score: number
): Promise<GameSessionResult> {
  const { data, error } = await supabase.rpc('submit_game_result', {
    p_session_id: sessionId,
    p_score: score,
  });
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  return {
    sessionId: str(row.sessionId),
    status: str(row.status),
    score: typeof row.score === 'number' ? row.score : null,
    rewardTokens: num(row.rewardTokens),
    denyReason: str(row.denyReason),
    tokenBalance: num(row.tokenBalance),
    dailyGameTokens: num(row.dailyGameTokens),
    weeklyGameTokens: num(row.weeklyGameTokens),
    alreadySubmitted: bool(row.alreadySubmitted),
    message: str(row.message) || undefined,
  };
}

export async function claimDailyReward(): Promise<{ amount: number; streak: number; tokenBalance: number }> {
  const { data, error } = await supabase.rpc('claim_daily_reward');
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  return {
    amount: num(row.amount),
    streak: num(row.streak),
    tokenBalance: num(row.tokenBalance),
  };
}

export async function staffSetFlag(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('staff_set_gamification_flag', {
    p_id: id,
    p_enabled: enabled,
  });
  throwIfError(error);
}

export async function staffUpdateGame(input: {
  id: string;
  enabled: boolean;
  featured: boolean;
  maintenance: boolean;
  releaseState: string;
  rewardBands: unknown;
}): Promise<void> {
  const { error } = await supabase.rpc('staff_update_game', {
    p_id: input.id,
    p_enabled: input.enabled,
    p_featured: input.featured,
    p_maintenance: input.maintenance,
    p_release_state: input.releaseState,
    p_reward_bands: input.rewardBands,
  });
  throwIfError(error);
}

export async function staffAdjustTokens(
  uid: string,
  amount: number,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc('staff_adjust_tokens', {
    p_uid: uid,
    p_amount: amount,
    p_reason: reason,
  });
  throwIfError(error);
}

export async function staffGamificationStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('staff_gamification_stats');
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  return {
    playgroundUsers: num(row.playgroundUsers),
    gamesToday: num(row.gamesToday),
    gamesWeek: num(row.gamesWeek),
    tokensEarned: num(row.tokensEarned),
    tokensSpent: num(row.tokensSpent),
    rewardedSessions: num(row.rewardedSessions),
    practiceSessions: num(row.practiceSessions),
  };
}
