import { describe, expect, it } from 'vitest';
import { emptyProfile } from '../profile/types';
import { mergeWorkspaceProfile } from './workspaceProfile';

describe('mergeWorkspaceProfile', () => {
  it('keeps server visibility when the workspace JSON is still private', () => {
    const current = emptyProfile();
    const merged = mergeWorkspaceProfile(
      { username: '', visibility: 'private', displayName: 'Rony' },
      { username: 'dasrony231', displayName: 'Rony' },
      current,
      { visibility: 'public', bio: 'hello' }
    );
    expect(merged.visibility).toBe('public');
    expect(merged.bio).toBe('hello');
    expect(merged.username).toBe('dasrony231');
  });

  it('keeps workspace extras when the profile row bio is an empty string', () => {
    const current = {
      ...emptyProfile(),
      location: 'Austin',
      bio: 'typed locally',
      favoriteGenres: ['Electronic'],
    };
    const merged = mergeWorkspaceProfile(
      { location: 'Austin', bio: 'from workspace', favoriteGenres: ['Electronic'] },
      { username: 'ada', displayName: 'Ada' },
      current,
      { visibility: 'public', bio: '' }
    );
    expect(merged.location).toBe('Austin');
    expect(merged.bio).toBe('typed locally');
    expect(merged.favoriteGenres).toEqual(['Electronic']);
  });

  it('keeps local listens when extras are stale', () => {
    const current = {
      ...emptyProfile(),
      totalListens: 4,
      listensByDay: { '2026-10-03': 4 },
    };
    const merged = mergeWorkspaceProfile(
      { totalListens: 1, listensByDay: { '2026-10-01': 1 } },
      { username: 'ada', displayName: 'Ada' },
      current,
      {
        extras: {
          totalListens: 1,
          listensByDay: { '2026-10-01': 1 },
        },
      }
    );
    expect(merged.totalListens).toBe(5);
    expect(merged.listensByDay).toEqual({
      '2026-10-01': 1,
      '2026-10-03': 4,
    });
  });

  it('uses profiles extras as the source of truth', () => {
    const merged = mergeWorkspaceProfile(
      { location: 'old', bio: 'workspace', favoriteGenres: ['Rock'] },
      { username: 'ada', displayName: 'Ada' },
      emptyProfile(),
      {
        visibility: 'public',
        bio: 'hello',
        extras: {
          location: 'Austin, TX',
          bio: 'Building Synapse',
          favoriteGenres: ['Electronic'],
        },
      }
    );
    expect(merged.location).toBe('Austin, TX');
    expect(merged.bio).toBe('Building Synapse');
    expect(merged.favoriteGenres).toEqual(['Electronic']);
  });
});
