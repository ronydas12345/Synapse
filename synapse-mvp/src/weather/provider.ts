import type { WeatherState } from '../conditional/types';

export interface WeatherObservation {
  state: WeatherState;
  windKmh?: number;
  fetchedAt: number;
}

export interface WeatherProvider {
  id: string;
  fetchCurrent(lat: number, lon: number): Promise<WeatherObservation>;
}
