import { weatherFromWmo } from './normalize';
import type { WeatherObservation, WeatherProvider } from './provider';

interface OpenMeteoCurrent {
  current?: {
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

export function createOpenMeteoProvider(
  fetchFn: typeof fetch = fetch
): WeatherProvider {
  return {
    id: 'open-meteo',
    async fetchCurrent(lat: number, lon: number): Promise<WeatherObservation> {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}` +
        `&longitude=${encodeURIComponent(String(lon))}` +
        `&current=weather_code,wind_speed_10m&wind_speed_unit=kmh`;
      const res = await fetchFn(url);
      if (!res.ok) throw new Error('Weather request failed');
      const json = (await res.json()) as OpenMeteoCurrent;
      const code = Number(json.current?.weather_code);
      const wind = Number(json.current?.wind_speed_10m) || 0;
      return {
        state: weatherFromWmo(code, wind),
        windKmh: wind,
        fetchedAt: Date.now(),
      };
    },
  };
}
