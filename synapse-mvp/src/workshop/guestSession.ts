const KEY = 'synapse_workshop_guest_play';

export function markWorkshopGuestSession(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* private mode */
  }
}

export function hasWorkshopGuestSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function isGuestWorkshopWorkspace(
  route: string,
  user: { uid?: string } | null | undefined
): boolean {
  if (user) return false;
  if (route !== 'listen' && route !== 'edit') return false;
  return hasWorkshopGuestSession();
}
