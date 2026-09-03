import { describe, expect, it } from 'vitest';
import { mapSpectrumBars, VISUALIZER_BAR_COUNT } from './spectrumBars';

describe('mapSpectrumBars', () => {
  it('places energy in the last bars when only high bins are hot', () => {
    const bins = new Uint8Array(1024);
    for (let i = 900; i < 1024; i++) bins[i] = 200;
    const bars = mapSpectrumBars(bins, VISUALIZER_BAR_COUNT, 44100, 2048);
    const low = bars.slice(0, 8).reduce((a, b) => a + b, 0);
    const high = bars.slice(-6).reduce((a, b) => a + b, 0);
    expect(high).toBeGreaterThan(low);
    expect(Math.max(...bars.slice(-4))).toBe(200);
  });

  it('places energy in the first bars when only low bins are hot', () => {
    const bins = new Uint8Array(1024);
    for (let i = 1; i < 8; i++) bins[i] = 180;
    const bars = mapSpectrumBars(bins, VISUALIZER_BAR_COUNT, 44100, 2048);
    expect(bars[0]).toBeGreaterThan(0);
    expect(bars[bars.length - 1]).toBe(0);
  });

  it('returns zeros for empty input', () => {
    expect(mapSpectrumBars(new Uint8Array(0), 8, 44100, 2048)).toEqual(Array(8).fill(0));
  });
});
