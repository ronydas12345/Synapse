export const TOKEN_LABEL = 'Tokens';

export type GameCategory =
  | 'reaction'
  | 'memory'
  | 'rhythm'
  | 'pattern'
  | 'timing'
  | 'logic'
  | 'visual'
  | 'audio'
  | 'sequence'
  | 'precision'
  | 'speed';

export type GameReleaseState =
  | 'draft'
  | 'internal'
  | 'superadmin'
  | 'staged'
  | 'public'
  | 'disabled'
  | 'archived';

export interface RewardBand {
  min: number;
  max: number;
  tokens: number;
}

export interface GameRecord {
  id: string;
  name: string;
  description: string;
  category: GameCategory | string;
  release_state: GameReleaseState | string;
  enabled: boolean;
  featured: boolean;
  maintenance: boolean;
  estimated_seconds: number;
  min_duration_ms: number;
  reward_bands: RewardBand[];
  sort_order: number;
}

export interface Wallet {
  uid: string;
  token_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  daily_game_tokens: number;
  weekly_game_tokens: number;
  current_streak: number;
  longest_streak: number;
  last_daily_claim: string | null;
}

export interface GameSessionResult {
  sessionId: string;
  status: string;
  score: number | null;
  rewardTokens: number;
  denyReason: string;
  tokenBalance?: number;
  dailyGameTokens?: number;
  weeklyGameTokens?: number;
  alreadySubmitted?: boolean;
  message?: string;
}

export interface GamificationState {
  wallet: Wallet;
  config: {
    tokenLabel?: string;
    dailyGameTokenCap?: number;
    weeklyGameTokenCap?: number;
    dailyRewardSchedule?: number[];
  };
  flags: Record<string, boolean>;
  games: GameRecord[];
  recent: {
    id: string;
    game_id: string;
    practice: boolean;
    status: string;
    score: number | null;
    reward_tokens: number;
    deny_reason: string;
    started_at: string;
  }[];
  dailyClaimed: boolean;
  isSuperadmin: boolean;
}

export interface GameProps {
  practice: boolean;
  reducedMotion: boolean;
  onComplete: (score: number) => void;
}
