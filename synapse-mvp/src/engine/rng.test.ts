import { describe, expect, it } from 'vitest';
import { createSeededRng, pickWeightedIndex } from './rng';

describe('createSeededRng', () => {
  it('returns the same sequence for the same seed', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('returns values in [0, 1)', () => {
    const rng = createSeededRng(7);
    for (let i = 0; i < 50; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('diverges for different seeds', () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    expect(Array.from({ length: 5 }, () => a())).not.toEqual(
      Array.from({ length: 5 }, () => b())
    );
  });
});

describe('pickWeightedIndex', () => {
  it('returns 0 for an empty weight list', () => {
    expect(pickWeightedIndex([], () => 0.5)).toBe(0);
  });

  it('returns 0 when all weights are zero or negative', () => {
    expect(pickWeightedIndex([0, 0, -4], () => 0.9)).toBe(0);
  });

  it('picks the first index when rng rolls the low end', () => {
    expect(pickWeightedIndex([10, 10], () => 0)).toBe(0);
  });

  it('picks the last index when rng rolls the high end', () => {
    expect(pickWeightedIndex([10, 10], () => 0.999)).toBe(1);
  });

  it('is deterministic with a seeded rng', () => {
    const rng = createSeededRng(99);
    const picks = Array.from({ length: 6 }, () =>
      pickWeightedIndex([1, 3, 6], rng)
    );
    const rng2 = createSeededRng(99);
    const picks2 = Array.from({ length: 6 }, () =>
      pickWeightedIndex([1, 3, 6], rng2)
    );
    expect(picks).toEqual(picks2);
  });
});
