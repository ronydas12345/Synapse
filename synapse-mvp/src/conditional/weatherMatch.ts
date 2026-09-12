import type { WeatherState } from './types';

export function selectWeatherPathIndex(
  pathWeather: WeatherState[][],
  current: WeatherState
): number {
  const state: WeatherState = current || 'other';
  for (let i = 0; i < pathWeather.length; i++) {
    const assigned = pathWeather[i] || [];
    if (assigned.includes(state)) return i;
  }
  if (state !== 'other') {
    for (let i = 0; i < pathWeather.length; i++) {
      if ((pathWeather[i] || []).includes('other')) return i;
    }
  }
  if (pathWeather.length === 0) return 0;
  return pathWeather.length - 1;
}
