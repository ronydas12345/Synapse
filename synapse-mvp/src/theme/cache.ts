export const THEME_CACHE_KEY = 'synapse_theme_cache';

export function readThemeCacheRaw(): Record<string, unknown> | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function mergeThemeCache(patch: Record<string, unknown>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const prev = readThemeCacheRaw() || {};
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    /* quota / private mode */
  }
}
