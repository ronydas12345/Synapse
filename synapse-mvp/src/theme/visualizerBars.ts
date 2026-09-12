export const VISUALIZER_BAR_OPTIONS = [12, 16, 24, 28, 32, 48] as const;

export type VisualizerBarCount = (typeof VISUALIZER_BAR_OPTIONS)[number];

export const DEFAULT_VISUALIZER_BAR_COUNT: VisualizerBarCount = 28;

export function sanitizeVisualizerBarCount(
  value: unknown,
  fallback: number = DEFAULT_VISUALIZER_BAR_COUNT
): number {
  const n = Number(value);
  const start = Number.isFinite(n) ? n : fallback;
  return VISUALIZER_BAR_OPTIONS.reduce((best, opt) =>
    Math.abs(opt - start) < Math.abs(best - start) ? opt : best
  );
}
