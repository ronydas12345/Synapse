import type { DateRule, WeatherState } from './types';

const WEATHER_PRESETS: WeatherState[][] = [
  ['clear'],
  ['rain', 'drizzle', 'thunderstorm'],
  ['snow', 'sleet'],
  ['partlyCloudy', 'cloudy'],
  ['fog'],
  ['windy'],
];

export function defaultPathWeather(numPaths: number): WeatherState[][] {
  const n = Math.max(1, numPaths);
  return Array.from({ length: n }, (_, i) => {
    if (i === n - 1) return ['other'] as WeatherState[];
    return [...(WEATHER_PRESETS[i] || [])];
  });
}

export function defaultWeekdayRule(days: number[]): DateRule {
  return { join: 'any', clauses: [{ kind: 'in', field: 'weekday', values: days }] };
}

export function defaultCatchAllRule(): DateRule {
  return { join: 'any', clauses: [{ kind: 'catchAll' }] };
}

export function defaultPathDateRules(numPaths: number): DateRule[][] {
  const n = Math.max(1, numPaths);
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return [defaultWeekdayRule([1, 2, 3, 4, 5])];
    if (n === 2 && i === 1) return [defaultWeekdayRule([0, 6])];
    if (i === n - 1) return [defaultCatchAllRule()];
    return [] as DateRule[];
  });
}

export function padPathList<T>(list: T[] | undefined, length: number, make: (i: number) => T): T[] {
  const src = Array.isArray(list) ? list : [];
  return Array.from({ length }, (_, i) => (src[i] !== undefined ? src[i] : make(i)));
}
