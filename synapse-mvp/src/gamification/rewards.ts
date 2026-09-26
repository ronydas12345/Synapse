import type { RewardBand } from './types';

export const DEFAULT_BANDS: RewardBand[] = [
  { min: 0, max: 49, tokens: 10 },
  { min: 50, max: 79, tokens: 20 },
  { min: 80, max: 94, tokens: 30 },
  { min: 95, max: 100, tokens: 40 },
];

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function tokensForScore(score: number, bands: RewardBand[] = DEFAULT_BANDS): number {
  const value = clampScore(score);
  let tokens = 0;
  for (const band of bands) {
    if (value >= band.min && value <= band.max) tokens = Math.max(0, band.tokens);
  }
  return tokens;
}

export function rewardRange(bands: RewardBand[] = DEFAULT_BANDS): { min: number; max: number } {
  const amounts = bands.map((band) => band.tokens);
  return {
    min: amounts.length ? Math.min(...amounts) : 0,
    max: amounts.length ? Math.max(...amounts) : 0,
  };
}

export function parseBands(raw: unknown): RewardBand[] {
  if (!Array.isArray(raw)) return DEFAULT_BANDS;
  const bands = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const min = Number(row.min);
      const max = Number(row.max);
      const tokens = Number(row.tokens);
      if (![min, max, tokens].every(Number.isFinite)) return null;
      return { min, max, tokens };
    })
    .filter((row): row is RewardBand => Boolean(row));
  return bands.length ? bands : DEFAULT_BANDS;
}
