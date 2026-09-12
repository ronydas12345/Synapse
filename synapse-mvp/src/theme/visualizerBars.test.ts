import { describe, expect, it } from 'vitest';
import { sanitizeVisualizerBarCount, VISUALIZER_BAR_OPTIONS } from './visualizerBars';

describe('visualizer bar count', () => {
  it('snaps junk onto the nearest allowlisted count', () => {
    expect(sanitizeVisualizerBarCount(30)).toBe(28);
    expect(sanitizeVisualizerBarCount('12')).toBe(12);
    expect(sanitizeVisualizerBarCount('nope')).toBe(28);
    expect(VISUALIZER_BAR_OPTIONS).toContain(sanitizeVisualizerBarCount(99));
  });
});
