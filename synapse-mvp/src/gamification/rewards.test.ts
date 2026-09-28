import { describe, expect, it } from 'vitest';
import { clampScore, parseBands, rewardRange, tokensForScore } from './rewards';

describe('gamification rewards', () => {
  it('maps score bands without gambling randomness', () => {
    expect(tokensForScore(0)).toBe(10);
    expect(tokensForScore(49)).toBe(10);
    expect(tokensForScore(50)).toBe(20);
    expect(tokensForScore(94)).toBe(30);
    expect(tokensForScore(100)).toBe(40);
    expect(clampScore(140)).toBe(100);
    expect(clampScore(-4)).toBe(0);
    expect(rewardRange().min).toBe(10);
    expect(rewardRange().max).toBe(40);
  });

  it('falls back when bands are missing', () => {
    expect(parseBands(null)).toHaveLength(4);
    expect(tokensForScore(80, parseBands([{ min: 0, max: 100, tokens: 12 }]))).toBe(12);
  });
});
