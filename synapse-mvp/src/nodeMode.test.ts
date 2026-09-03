import { describe, expect, it } from 'vitest';
import {
  CONDITIONAL_MODE_OPTIONS,
  RANDOMIZER_MODE_OPTIONS,
  conditionalModePatch,
  randomizerModePatch,
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
});
