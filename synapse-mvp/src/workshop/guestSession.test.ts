import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasWorkshopGuestSession,
  isGuestWorkshopWorkspace,
  markWorkshopGuestSession,
} from './guestSession';

describe('workshop guest session', () => {
  const memory = new Map<string, string>();

  afterEach(() => {
    memory.clear();
    vi.unstubAllGlobals();
  });

  it('lets unsigned visitors open listen and edit after Play or Remix', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      clear: () => memory.clear(),
    });
    expect(isGuestWorkshopWorkspace('listen', null)).toBe(false);
    markWorkshopGuestSession();
    expect(hasWorkshopGuestSession()).toBe(true);
    expect(isGuestWorkshopWorkspace('listen', null)).toBe(true);
    expect(isGuestWorkshopWorkspace('edit', null)).toBe(true);
    expect(isGuestWorkshopWorkspace('settings', null)).toBe(false);
    expect(isGuestWorkshopWorkspace('listen', { uid: 'user' })).toBe(false);
  });
});
