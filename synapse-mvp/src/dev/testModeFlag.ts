/** In-memory flag only. Must not be persisted. */
let active = false;
const listeners = new Set<() => void>();

export function isNewUserTestMode(): boolean {
  return active;
}

export function setNewUserTestMode(on: boolean): void {
  if (active === on) return;
  active = on;
  listeners.forEach((fn) => fn());
}

export function subscribeNewUserTestMode(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function resetNewUserTestModeForTests(): void {
  setNewUserTestMode(false);
}
