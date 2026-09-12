import { LIBRARY_KEY, LEGACY_GRAPH_KEY } from '../playlists/library';
import { METADATA_STORAGE_KEY, clearCreditsCache, creditsCacheSize } from '../metadata/cache';
import { PROFILE_STORAGE_KEY } from '../profile/profileStore';
import { THEME_STORAGE_KEY } from '../theme/themeStore';
import { TUTORIAL_SESSION_KEY, TUTORIAL_STORAGE_KEY } from '../tutorial/tutorialStorage';
import { clearWeatherCache } from '../weather/client';
import { SETTINGS_STORAGE_KEY } from './types';

export const SYNAPSE_LOCAL_KEYS = [
  SETTINGS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  LIBRARY_KEY,
  LEGACY_GRAPH_KEY,
  METADATA_STORAGE_KEY,
  TUTORIAL_STORAGE_KEY,
] as const;

export function listedLocalKeys(): { key: string; present: boolean }[] {
  return SYNAPSE_LOCAL_KEYS.map((key) => {
    try {
      return { key, present: localStorage.getItem(key) != null };
    } catch {
      return { key, present: false };
    }
  });
}

export function clearMetadataCache(): number {
  const size = creditsCacheSize();
  clearCreditsCache();
  return size;
}

export function wipeSynapseLocalData(): void {
  for (const key of SYNAPSE_LOCAL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* quota / private mode */
    }
  }
  try {
    sessionStorage.removeItem(TUTORIAL_SESSION_KEY);
  } catch {
    /* ignore */
  }
  clearWeatherCache();
}

export { clearWeatherCache };
