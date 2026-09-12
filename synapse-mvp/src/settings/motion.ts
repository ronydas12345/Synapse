import type { MotionPreference } from './types';

export function osPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function resolveReducedMotion(
  preference: MotionPreference,
  osReduce = osPrefersReducedMotion()
): boolean {
  if (preference === 'reduce') return true;
  if (preference === 'full') return false;
  return osReduce;
}

export function applyMotionPreference(preference: MotionPreference): void {
  if (typeof document === 'undefined') return;
  const reduced = resolveReducedMotion(preference);
  document.documentElement.dataset.motion = preference;
  document.documentElement.classList.toggle('synapse-reduce-motion', reduced);
}

/** Reads the class/dataset applied by Settings, then falls back to the OS. */
export function documentPrefersReducedMotion(): boolean {
  if (typeof document !== 'undefined') {
    if (document.documentElement.dataset.motion === 'full') return false;
    if (document.documentElement.classList.contains('synapse-reduce-motion')) return true;
  }
  return osPrefersReducedMotion();
}
