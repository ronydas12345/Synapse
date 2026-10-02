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

  it('falls back to workspace JSON when the profile row is missing', () => {
    const merged = mergeWorkspaceProfile(
      { visibility: 'unlisted', username: 'ada' },
      undefined,
      emptyProfile(),
      null
    );
    expect(merged.visibility).toBe('unlisted');
    expect(merged.username).toBe('ada');
  });
});
