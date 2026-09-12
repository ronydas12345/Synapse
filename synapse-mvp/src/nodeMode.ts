/** Shared mode values written by inspector and on-node dropdowns. */

import {
  defaultCatchAllRule,
  defaultPathDateRules,
  defaultPathWeather,
  padPathList,
} from './conditional/defaults';
import type { DateRule, WeatherState } from './conditional/types';

export const CONDITIONAL_MODE_OPTIONS = [
  { value: 'random', label: 'Weighted Random' },
  { value: 'timeRange', label: 'Time Range' },
  { value: 'weather', label: 'Weather' },
  { value: 'day', label: 'Day / Date' },
] as const;

export function conditionalModeLabel(mode: string | undefined): string {
  return (
    CONDITIONAL_MODE_OPTIONS.find((opt) => opt.value === mode)?.label ??
    'Weighted Random'
  );
}

export const RANDOMIZER_MODE_OPTIONS = [
  { value: 'sequence', label: 'Sequence' },
  { value: 'randomizer', label: 'Weighted Random' },
] as const;

export type ConditionalMode = (typeof CONDITIONAL_MODE_OPTIONS)[number]['value'];
export type RandomizerMode = (typeof RANDOMIZER_MODE_OPTIONS)[number]['value'];

/**
 * Patch for Conditional `data.mode`. Merges via updateNodeData — weights and
 * existing path settings are preserved. Initializes missing mode-specific lists.
 */
export function conditionalModePatch(
  data: Record<string, unknown> | undefined,
  newMode: string
): Record<string, unknown> {
  const numPaths = Number(data?.numPaths) || 2;
  if (newMode === 'timeRange' && !data?.pathTimeRanges) {
    return {
      mode: newMode,
      pathTimeRanges: Array.from({ length: numPaths }, () => [
        { start: 0, end: 23 },
      ]),
    };
  }
  if (newMode === 'weather' && !data?.pathWeather) {
    return { mode: newMode, pathWeather: defaultPathWeather(numPaths) };
  }
  if (newMode === 'day' && !data?.pathDateRules) {
    return { mode: newMode, pathDateRules: defaultPathDateRules(numPaths) };
  }
  return { mode: newMode };
}

export function resizeConditionalPaths(
  data: Record<string, unknown> | undefined,
  newNumPaths: number
): Record<string, unknown> {
  const n = Math.max(2, Math.min(10, newNumPaths));
  const oldWeights = (data?.weights as number[]) || [];
  const oldTimeRanges =
    (data?.pathTimeRanges as Array<Array<{ start: number; end: number }>>) || [];
  const oldWeather = (data?.pathWeather as WeatherState[][]) || [];
  const oldDates = (data?.pathDateRules as DateRule[][]) || [];
  const weatherDefaults = defaultPathWeather(n);
  const dateDefaults = defaultPathDateRules(n);
  return {
    numPaths: n,
    weights: Array.from({ length: n }, (_, i) => oldWeights[i] || 10),
    pathTimeRanges: Array.from({ length: n }, (_, i) => oldTimeRanges[i] || [{ start: 0, end: 23 }]),
    pathWeather: padPathList(oldWeather, n, (i) => weatherDefaults[i] || ['other']),
    pathDateRules: padPathList(oldDates, n, (i) => dateDefaults[i] || [defaultCatchAllRule()]),
  };
}

/**
 * Patch for Sequence/Randomizer `data.mode`. Weights stay on the node; the
 * engine and UI hide them in sequence mode and restore them in randomizer mode.
 */
export function randomizerModePatch(
  _data: Record<string, unknown> | undefined,
  newMode: string
): Record<string, unknown> {
  return { mode: newMode };
}
