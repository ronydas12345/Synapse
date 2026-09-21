import { describe, expect, it } from 'vitest';
import { parseLibrary, nextUntitledName, uniquePathName } from './library';

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

  it('parses a stored library back into paths', () => {
    const parsed = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Focus',
          visibility: 'private',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
          updatedAt: '2026-09-21T00:00:00.000Z',
        },
      ],
    });
    expect(parsed.activeId).toBe('p1');
    expect(parsed.paths[0].name).toBe('Focus');
  });
});
