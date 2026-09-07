import { describe, expect, it } from 'vitest';
import { nextUntitledName } from './library';

describe('playlist library', () => {
  it('names new playlists without colliding', () => {
    expect(nextUntitledName([])).toBe('Untitled playlist');
    expect(nextUntitledName(['Untitled playlist'])).toBe('Untitled playlist 2');
    expect(nextUntitledName(['Untitled playlist', 'Untitled playlist 2'])).toBe(
      'Untitled playlist 3'
    );
  });
});
