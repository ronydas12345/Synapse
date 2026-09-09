import { describe, expect, it } from 'vitest';
import { nextUntitledName, uniquePathName } from './library';

describe('playlist library', () => {
  it('names new playlists without colliding', () => {
    expect(nextUntitledName([])).toBe('Untitled playlist');
    expect(nextUntitledName(['Untitled playlist'])).toBe('Untitled playlist 2');
    expect(nextUntitledName(['Untitled playlist', 'Untitled playlist 2'])).toBe(
      'Untitled playlist 3'
    );
  });

  it('renames imported playlists when the title already exists', () => {
    expect(uniquePathName(['Focus'], 'Focus')).toBe('Focus copy');
    expect(uniquePathName(['Focus', 'Focus copy'], 'Focus')).toBe('Focus copy 2');
  });
});
