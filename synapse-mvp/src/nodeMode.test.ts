import { describe, expect, it } from 'vitest';
import {
  CONDITIONAL_MODE_OPTIONS,
  RANDOMIZER_MODE_OPTIONS,
  conditionalModePatch,
  randomizerModePatch,
  resizeConditionalPaths,
} from './nodeMode';

describe('mode dropdown patches', () => {
  it('writes Conditional mode with the same data field as the previous picker', () => {
    const data = {
      mode: 'random',
      weights: [70, 30],
      numPaths: 2,
      pathTimeRanges: [[{ start: 0, end: 11 }], [{ start: 12, end: 23 }]],
    };
    expect(conditionalModePatch(data, 'timeRange')).toEqual({
      mode: 'timeRange',
    });
    expect(conditionalModePatch(data, 'random')).toEqual({ mode: 'random' });
    const merged = { ...data, ...conditionalModePatch(data, 'timeRange') };
    expect(merged.weights).toEqual([70, 30]);
    expect(merged.pathTimeRanges).toEqual(data.pathTimeRanges);
    expect(CONDITIONAL_MODE_OPTIONS.map((o) => o.value)).toEqual([
      'random',
      'timeRange',
      'weather',
      'day',
    ]);
  });

  it('initializes pathTimeRanges only when switching to timeRange without them', () => {
    const data = { mode: 'random', weights: [10, 10], numPaths: 3 };
    const patch = conditionalModePatch(data, 'timeRange');
    expect(patch.mode).toBe('timeRange');
    expect(patch.pathTimeRanges).toEqual([
      [{ start: 0, end: 23 }],
      [{ start: 0, end: 23 }],
      [{ start: 0, end: 23 }],
    ]);
    expect(patch.weights).toBeUndefined();
  });

  it('writes Sequence/Randomizer mode without wiping weights', () => {
    const data = {
      mode: 'randomizer',
      tracks: ['t1', 't2'],
      weights: [70, 30],
    };
    expect(randomizerModePatch(data, 'sequence')).toEqual({ mode: 'sequence' });
    expect(randomizerModePatch(data, 'randomizer')).toEqual({
      mode: 'randomizer',
    });
    const merged = { ...data, ...randomizerModePatch(data, 'sequence') };
    expect(merged.weights).toEqual([70, 30]);
    expect(merged.tracks).toEqual(['t1', 't2']);
    expect(RANDOMIZER_MODE_OPTIONS.map((o) => o.value)).toEqual([
      'sequence',
      'randomizer',
    ]);
  });

  it('initializes weather and day path lists when switching modes', () => {
    const data = { mode: 'random', weights: [10, 10], numPaths: 2 };
    const weather = conditionalModePatch(data, 'weather');
    expect(weather.mode).toBe('weather');
    expect(weather.pathWeather).toEqual([['clear'], ['other']]);
    const day = conditionalModePatch(data, 'day');
    expect(day.mode).toBe('day');
    expect(Array.isArray(day.pathDateRules)).toBe(true);
    expect((day.pathDateRules as unknown[]).length).toBe(2);
  });

  it('resizes weather and date lists with the path count', () => {
    const resized = resizeConditionalPaths(
      {
        mode: 'weather',
        numPaths: 2,
        weights: [10, 10],
        pathWeather: [['clear'], ['other']],
      },
      3
    );
    expect(resized.numPaths).toBe(3);
    expect((resized.pathWeather as string[][]).length).toBe(3);
    expect((resized.pathDateRules as unknown[]).length).toBe(3);
    expect((resized.weights as number[]).length).toBe(3);
  });
});
