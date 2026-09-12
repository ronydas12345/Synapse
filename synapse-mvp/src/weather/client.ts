import { useProfileStore } from '../profile/profileStore';
import type { WeatherState } from '../conditional/types';
import { getAppSettings } from '../settings/settingsStore';
import { createOpenMeteoProvider } from './openMeteo';
import type { WeatherProvider } from './provider';

const CACHE_MS = 20 * 60 * 1000;
const GEO_DENIED_KEY = 'synapse_geo_denied';

export type WeatherStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export interface WeatherSnapshot {
  state: WeatherState;
  status: WeatherStatus;
  source: 'profile' | 'geo' | 'none';
  placeLabel: string;
  fetchedAt: number | null;
  error: string | null;
}

const listeners = new Set<() => void>();

let snapshot: WeatherSnapshot = {
  state: 'other',
  status: 'idle',
  source: 'none',
  placeLabel: '',
  fetchedAt: null,
  error: null,
};

let inflight: Promise<void> | null = null;
let provider: WeatherProvider = createOpenMeteoProvider();

export function setWeatherProvider(next: WeatherProvider): void {
  provider = next;
}

export function getWeatherSnapshot(): WeatherSnapshot {
  return snapshot;
}

export function subscribeWeather(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  for (const fn of listeners) fn();
}

function setSnapshot(partial: Partial<WeatherSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  emit();
}

export function graphNeedsWeather(
  nodes: Array<{ data?: Record<string, unknown> | undefined }>
): boolean {
  return nodes.some((n) => n.data?.mode === 'weather');
}

function profileCoords(): { lat: number; lon: number; label: string } | null {
  const profile = useProfileStore.getState().profile;
  if (profile.locationLat == null || profile.locationLon == null) return null;
  return {
    lat: profile.locationLat,
    lon: profile.locationLon,
    label: profile.location || 'Saved location',
  };
}

function geoDenied(): boolean {
  try {
    return sessionStorage.getItem(GEO_DENIED_KEY) === '1';
  } catch {
    return false;
  }
}

function markGeoDenied(): void {
  try {
    sessionStorage.setItem(GEO_DENIED_KEY, '1');
  } catch {
    /* ignore */
  }
}

function requestGeo(): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  if (geoDenied()) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        markGeoDenied();
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 8000 }
    );
  });
}

async function resolveCoords(allowGeo: boolean): Promise<{
  lat: number;
  lon: number;
  source: 'profile' | 'geo';
  label: string;
} | null> {
  const saved = profileCoords();
  if (saved) return { ...saved, source: 'profile' };
  if (!allowGeo) return null;
  const geo = await requestGeo();
  if (!geo) return null;
  return { ...geo, source: 'geo', label: 'Current location' };
}

export async function resolvePlaybackWeather(
  nodes: Array<{ data?: Record<string, unknown> | undefined }>
): Promise<WeatherState> {
  if (graphNeedsWeather(nodes)) {
    await refreshWeather({ allowGeo: getAppSettings().environment.allowGeolocation });
  }
  return getWeatherSnapshot().state;
}

export function resetWeatherForTests(): void {
  snapshot = {
    state: 'other',
    status: 'idle',
    source: 'none',
    placeLabel: '',
    fetchedAt: null,
    error: null,
  };
  inflight = null;
}

export function clearGeoDenied(): void {
  try {
    sessionStorage.removeItem(GEO_DENIED_KEY);
  } catch {
    /* ignore */
  }
}

export function clearWeatherCache(): void {
  resetWeatherForTests();
  clearGeoDenied();
}

export async function refreshWeather(options?: { allowGeo?: boolean; force?: boolean }): Promise<void> {
  const allowGeo = options?.allowGeo ?? getAppSettings().environment.allowGeolocation;
  const force = options?.force ?? false;
  if (inflight) return inflight;

  const fresh =
    !force &&
    snapshot.fetchedAt != null &&
    Date.now() - snapshot.fetchedAt < CACHE_MS &&
    (snapshot.status === 'ready' || snapshot.status === 'unavailable');
  if (fresh) return;

  inflight = (async () => {
    setSnapshot({ status: 'loading', error: null });
    const coords = await resolveCoords(allowGeo);
    if (!coords) {
      setSnapshot({
        state: 'other',
        status: 'unavailable',
        source: 'none',
        placeLabel: '',
        fetchedAt: Date.now(),
        error: 'Set a location on your Profile, or allow location access.',
      });
      return;
    }
    try {
      const obs = await provider.fetchCurrent(coords.lat, coords.lon);
      setSnapshot({
        state: obs.state,
        status: 'ready',
        source: coords.source,
        placeLabel: coords.label,
        fetchedAt: obs.fetchedAt,
        error: null,
      });
    } catch {
      setSnapshot({
        state: 'other',
        status: 'unavailable',
        source: coords.source,
        placeLabel: coords.label,
        fetchedAt: Date.now(),
        error: 'Weather is unavailable. Using Other / Unknown.',
      });
    }
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
