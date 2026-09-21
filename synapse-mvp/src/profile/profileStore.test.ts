import { describe, expect, it, beforeEach } from 'vitest';
import {
  activitySeries,
  averageListens,
  displayNameError,
  daysSince,
  normalizeUsername,
  readStashedProfile,
  reorderSectionOrder,
  usernameError,
  writeStashedProfile,
} from './profileStore';
import { emptyProfile, GENRE_PRESETS, OPTIONAL_SECTIONS } from './types';

describe('profile helpers', () => {
  it('normalizes @username to a lowercase handle', () => {
    expect(normalizeUsername(' @Ada_Lovelace ')).toBe('ada_lovelace');
  });

  it('rejects invalid usernames', () => {
    expect(usernameError('')).toBeTruthy();
    expect(usernameError('ab')).toBeTruthy();
    expect(usernameError('Has Space')).toBeTruthy();
    expect(usernameError('ok_name')).toBeNull();
  });

  it('requires a display name', () => {
    expect(displayNameError('  ')).toBeTruthy();
    expect(displayNameError('Ada')).toBeNull();
  });

  it('computes average listens over elapsed days', () => {
    const profile = emptyProfile();
    profile.createdAt = new Date(Date.now() - 2 * 86_400_000).toISOString();
    profile.totalListens = 9;
    expect(daysSince(profile.createdAt)).toBe(3);
    expect(averageListens(profile)).toBe(3);
  });

  it('builds an activity series ending today', () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const series = activitySeries({ [`${y}-${m}-${d}`]: 4 }, 7);
    expect(series).toHaveLength(7);
    expect(series[6]).toBe(4);
    expect(series.slice(0, 6).every((n) => n === 0)).toBe(true);
  });

  it('reorders optional sections before or after the drop target', () => {
    const before = reorderSectionOrder([...OPTIONAL_SECTIONS], 'songs', 'bio', 'before');
    expect(before[1]).toBe('songs');
    expect(before[2]).toBe('bio');
    const after = reorderSectionOrder([...OPTIONAL_SECTIONS], 'songs', 'bio', 'after');
    expect(after[1]).toBe('bio');
    expect(after[2]).toBe('songs');
  });

  it('ships a wide, unique genre preset list', () => {
    expect(GENRE_PRESETS).toContain('Shoegaze');
    expect(GENRE_PRESETS).toContain('City Pop');
    expect(GENRE_PRESETS).toContain('Amapiano');
    expect(new Set(GENRE_PRESETS).size).toBe(GENRE_PRESETS.length);
    expect(GENRE_PRESETS.length).toBeGreaterThan(80);
    expect(GENRE_PRESETS.every((g) => g.length <= 32)).toBe(true);
  });
});

describe('per-account profile stash', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
  });

  it('does not return another account’s profile', () => {
    const profile = emptyProfile();
    profile.username = 'first_user';
    profile.displayName = 'First';
    writeStashedProfile('uid-a', profile);
    expect(readStashedProfile('uid-a')?.username).toBe('first_user');
    expect(readStashedProfile('uid-b')).toBeNull();
  });
});
