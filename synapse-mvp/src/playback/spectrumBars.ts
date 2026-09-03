/** Log-frequency mapping from AnalyserNode bins onto visualizer bars. */

export const VISUALIZER_FFT_SIZE = 2048;
export const VISUALIZER_BAR_COUNT = 28;
export const VISUALIZER_MIN_HZ = 40;

/**
 * Map FFT bins onto `barCount` bars using logarithmic frequency bands.
 * Each bar uses the peak bin in its band so high-frequency content is not
 * skipped by linear stride sampling.
 */
export function mapSpectrumBars(
  bins: Uint8Array,
  barCount: number,
  sampleRate: number,
  fftSize: number
): number[] {
  const bars = new Array<number>(Math.max(0, barCount)).fill(0);
  if (!bins.length || barCount <= 0 || !(sampleRate > 0) || !(fftSize > 0)) {
    return bars;
  }

  const nyquist = sampleRate / 2;
  const minHz = Math.min(VISUALIZER_MIN_HZ, nyquist / 4);
  const maxHz = nyquist;
  const hzPerBin = sampleRate / fftSize;
  const lastBin = bins.length - 1;

  for (let i = 0; i < barCount; i++) {
    const f0 = minHz * Math.pow(maxHz / minHz, i / barCount);
    const f1 = minHz * Math.pow(maxHz / minHz, (i + 1) / barCount);
    const i0 = Math.max(1, Math.floor(f0 / hzPerBin));
    const i1 = Math.max(i0, Math.min(lastBin, Math.ceil(f1 / hzPerBin)));
    let peak = 0;
    for (let b = i0; b <= i1; b++) {
      const v = bins[b] ?? 0;
      if (v > peak) peak = v;
    }
    bars[i] = peak;
  }
  return bars;
}
