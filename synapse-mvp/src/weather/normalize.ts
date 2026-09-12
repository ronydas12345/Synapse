import type { WeatherState } from '../conditional/types';

const WINDY_KMH = 50;

/** Map Open-Meteo / WMO weather codes onto the stable enum. */
export function weatherFromWmo(
  code: number,
  windKmh = 0
): WeatherState {
  if (!Number.isFinite(code)) return 'other';
  const c = Math.floor(code);

  if (c >= 95 && c <= 99) return 'thunderstorm';
  if (c === 56 || c === 57 || c === 66 || c === 67) return 'sleet';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if ((c >= 61 && c <= 65) || (c >= 80 && c <= 82)) return 'rain';
  if (c >= 51 && c <= 55) return 'drizzle';
  if (c === 45 || c === 48) return 'fog';
  if (windKmh >= WINDY_KMH) return 'windy';
  if (c === 3) return 'cloudy';
  if (c === 2) return 'partlyCloudy';
  if (c === 0 || c === 1) return 'clear';
  return 'other';
}
