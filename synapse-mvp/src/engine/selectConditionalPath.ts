import { parsePathDateRules, parsePathWeather } from '../conditional/parse';
import { selectDatePathIndex } from '../conditional/dateMatch';
import { selectWeatherPathIndex } from '../conditional/weatherMatch';
import { pickWeightedIndex, type Rng } from './rng';
import type { WeatherState } from '../conditional/types';

function isHourInRanges(
  hour: number,
  ranges: Array<{ start: number; end: number }>
): boolean {
  return ranges.some((range) => {
    if (range.start <= range.end) {
      return hour >= range.start && hour <= range.end;
    }
    return hour >= range.start || hour <= range.end;
  });
}

export function selectConditionalPathIndex(
  data: Record<string, unknown> | undefined,
  ctx: {
    rng: Rng;
    currentHour: number;
    now: Date;
    weatherState: WeatherState;
  }
): number {
  const mode = (data?.mode as string) || 'random';
  const weights = (data?.weights as number[]) || [1, 1];
  const numPaths = Math.max(Number(data?.numPaths) || weights.length, 2);

  if (mode === 'timeRange') {
    const pathTimeRanges =
      (data?.pathTimeRanges as Array<Array<{ start: number; end: number }>>) ||
      Array(numPaths)
        .fill(null)
        .map(() => [{ start: 0, end: 23 }]);
    for (let i = 0; i < pathTimeRanges.length; i++) {
      if (isHourInRanges(ctx.currentHour, pathTimeRanges[i] || [])) return i;
    }
    return 0;
  }

  if (mode === 'weather') {
    return selectWeatherPathIndex(parsePathWeather(data?.pathWeather, numPaths), ctx.weatherState);
  }

  if (mode === 'day') {
    return selectDatePathIndex(parsePathDateRules(data?.pathDateRules, numPaths), ctx.now);
  }

  return pickWeightedIndex(weights, ctx.rng);
}
