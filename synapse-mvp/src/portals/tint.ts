import type { PortalDestination, PortalRole } from './types';

/** Azure for playlist-beginning hops. Not used by other node types. */
export const PORTAL_START_COLOR = '#1a7fd1';
/** Violet for hops that land on another playlist’s portal. Not used by other node types. */
export const PORTAL_HOP_COLOR = '#9d4ee8';

export type PortalColorKind = 'start' | 'hop';

/**
 * Blue: this portal sends playback to a playlist beginning.
 * Purple: this portal lands on (or receives from) another playlist’s portal.
 */
export function portalColorKind(
  dest: PortalDestination | null,
  role: PortalRole = 'unset'
): PortalColorKind {
  if (role === 'entry') return 'hop';
  if (dest?.mode === 'portal') return 'hop';
  return 'start';
}

export function portalColorVar(kind: PortalColorKind): string {
  return kind === 'hop' ? 'var(--node-portal-hop)' : 'var(--node-portal-start)';
}
