import { useSyncExternalStore } from 'react';
import { getWeatherSnapshot, subscribeWeather } from './client';

export function useWeatherSnapshot() {
  return useSyncExternalStore(subscribeWeather, getWeatherSnapshot, getWeatherSnapshot);
}
