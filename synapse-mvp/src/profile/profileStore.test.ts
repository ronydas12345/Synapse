import { describe, expect, it } from 'vitest';
import {
  activitySeries,
  averageListens,
  displayNameError,
  daysSince,
  normalizeUsername,
  reorderSectionOrder,
  usernameError,
} from './profileStore';
import { emptyProfile, OPTIONAL_SECTIONS } from './types';

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
});
