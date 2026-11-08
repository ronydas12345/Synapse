import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../auth/session';
import {
  emptyLibrary,
  type PathLibrary,
  type StoredMusicPath,
} from '../playlists/library';
import {
  canUseNewUserTestMode,
  isNewUserTestModeEnvEnabled,
  mergeTestLibrary,
} from './newUserTestMode';

function user(partial: Partial<SessionUser> = {}): SessionUser {
  return {
    uid: 'uid-1',
    email: 'dasrony231@gmail.com',
    username: 'rony',
    displayName: 'Rony',
    photoURL: null,
    emailVerified: true,
    providers: ['google.com'],
    ...partial,
  };
}

function pathWithGraph(id: string, name: string): StoredMusicPath {
  return {
    id,
    name,
    visibility: 'private',
    tags: [],
    updatedAt: '2026-11-07T00:00:00.000Z',
    nodes: [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 't1', type: 'track', position: { x: 80, y: 0 }, data: { songTitle: 'A' } },
    ],
    edges: [{ id: 'e1', source: 'start', target: 't1' }],
  };
}

function library(paths: StoredMusicPath[], activeId = paths[0]?.id ?? ''): PathLibrary {
  return { schemaVersion: 1, activeId, paths };
}

describe('new user test mode', () => {
  it('is off in production unless the env flag is set', () => {
    expect(isNewUserTestModeEnvEnabled({ DEV: false })).toBe(false);
    expect(
      isNewUserTestModeEnvEnabled({ DEV: false, VITE_NEW_USER_TEST_MODE: '0' })
    ).toBe(false);
    expect(
      isNewUserTestModeEnvEnabled({ DEV: false, VITE_NEW_USER_TEST_MODE: '1' })
    ).toBe(true);
    expect(isNewUserTestModeEnvEnabled({ DEV: true })).toBe(true);
  });

  it('does not let ordinary users activate the shortcut', () => {
    const env = { DEV: true, VITE_NEW_USER_TEST_MODE: '1' };
    expect(canUseNewUserTestMode(null, env)).toBe(false);
    expect(
      canUseNewUserTestMode(user({ email: 'someone@example.com' }), env)
    ).toBe(false);
    expect(canUseNewUserTestMode(user({ emailVerified: false }), env)).toBe(false);
    expect(canUseNewUserTestMode(user(), { DEV: false })).toBe(false);
    expect(canUseNewUserTestMode(user(), env)).toBe(true);
  });

  it('merges test playlists into the real library with Test: labels', () => {
    const real = library([pathWithGraph('real', 'Focus')]);
    const test = library([
      pathWithGraph('tmp', 'My playlist'),
      {
        ...pathWithGraph('empty', 'Empty'),
        nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      },
    ]);
    const merged = mergeTestLibrary(real, test);
    expect(merged.paths.map((path) => path.name)).toEqual(['Focus', 'Test: My playlist']);
    expect(merged.paths.some((path) => path.id === 'tmp')).toBe(false);
  });

  it('skips empty starter libraries and keeps existing Test: names unique', () => {
    const real = library([pathWithGraph('real', 'Test: First Steps')]);
    expect(mergeTestLibrary(real, emptyLibrary()).paths).toHaveLength(1);
    const merged = mergeTestLibrary(real, library([pathWithGraph('tmp', 'First Steps')]));
    expect(merged.paths.map((path) => path.name)).toEqual([
      'Test: First Steps',
      'Test: First Steps copy',
    ]);
  });
});
