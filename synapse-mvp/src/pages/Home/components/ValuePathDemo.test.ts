import { describe, expect, it } from 'vitest';
import { nextValueBeat, VALUE_BEAT_MS, VALUE_BEATS } from './ValuePathDemo';

describe('homepage value carousel', () => {
  it('advances build → branch → play → build', () => {
    expect(nextValueBeat('build')).toBe('branch');
    expect(nextValueBeat('branch')).toBe('play');
    expect(nextValueBeat('play')).toBe('build');
  });

  it('keeps each motion beat longer than a still frame', () => {
    for (const beat of VALUE_BEATS) {
      expect(VALUE_BEAT_MS[beat]).toBeGreaterThan(2500);
    }
    expect(VALUE_BEAT_MS.play).toBeGreaterThan(VALUE_BEAT_MS.build);
  });
});
