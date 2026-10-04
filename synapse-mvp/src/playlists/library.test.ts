import { describe, expect, it } from 'vitest';
import { parseLibrary, nextUntitledName, uniquePathName, deletePath, putImportedPath, emptyLibrary, linkPathWorkshop, findPathForWorkshop, replaceActiveGraph, preferStoredLibrary } from './library';

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
    expect(parsed.paths[0].tags).toEqual([]);
  });

  it('keeps the account playlist list when the browser still has an older copy', () => {
    const account = {
      schemaVersion: 1,
      activeId: 'db',
      paths: [{ id: 'db', name: 'From account', nodes: [], edges: [] }],
    };
    const local = {
      schemaVersion: 1,
      activeId: 'local',
      paths: [{ id: 'local', name: 'From this browser', nodes: [], edges: [] }],
    };
    expect(preferStoredLibrary(account, local)).toBe(account);
    expect(preferStoredLibrary({}, local)).toBe(local);
    expect(preferStoredLibrary(undefined, null)).toEqual({});
  });

  it('keeps curated playlist tags on a stored path', () => {
    const parsed = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Focus',
          visibility: 'private',
          tags: ['chill', 'made-up', 'focus'],
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
          updatedAt: '2026-09-21T00:00:00.000Z',
        },
      ],
    });
    expect(parsed.paths[0].tags).toEqual(['chill', 'focus']);
  });

  it('removes a playlist and keeps another as active', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Keep',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
        {
          id: 'p2',
          name: 'Drop',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    const next = deletePath(lib, 'p2');
    expect(next.paths.map((p) => p.id)).toEqual(['p1']);
    expect(next.activeId).toBe('p1');
  });

  it('switches away when the active playlist is deleted', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Drop',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
        {
          id: 'p2',
          name: 'Keep',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    const next = deletePath(lib, 'p1');
    expect(next.paths.map((p) => p.id)).toEqual(['p2']);
    expect(next.activeId).toBe('p2');
  });

  it('replaces the last playlist with a blank library path', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Only',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    const next = deletePath(lib, 'p1');
    expect(next.paths).toHaveLength(1);
    expect(next.paths[0].id).not.toBe('p1');
    expect(next.paths[0].name).toBe('My playlist');
    expect(next.paths[0].nodes).toHaveLength(1);
    expect(next.paths[0].edges).toEqual([]);
    expect(next.activeId).toBe(next.paths[0].id);
  });

  it('ignores a playlist id that is not in the library', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Keep',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    expect(deletePath(lib, 'missing')).toBe(lib);
  });

  it('inserts an imported path with every node and makes it active', () => {
    const lib = emptyLibrary();
    const next = putImportedPath(lib, {
      id: '',
      name: 'Workshop mix',
      visibility: 'private',
      tags: [],
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: 't1', type: 'track', position: { x: 120, y: 0 }, data: { videoId: 'abc' } },
        { id: 'style', type: 'style', position: { x: 240, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'start', target: 't1' }],
      updatedAt: '2026-10-03T00:00:00.000Z',
    });
    expect(next.paths).toHaveLength(2);
    const imported = next.paths.find((p) => p.id === next.activeId);
    expect(imported?.name).toBe('Workshop mix');
    expect(imported?.nodes.map((n) => n.id)).toEqual(['start', 't1', 'style']);
    expect(imported?.edges).toHaveLength(1);
  });

  it('keeps unlisted visibility and workshop ids on stored paths', () => {
    const parsed = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Focus',
          visibility: 'unlisted',
          workshopId: 'ws-1',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
          updatedAt: '2026-10-03T00:00:00.000Z',
        },
      ],
    });
    expect(parsed.paths[0].visibility).toBe('unlisted');
    expect(parsed.paths[0].workshopId).toBe('ws-1');
  });

  it('replaces an imported path by workshop id without renaming it', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Mine',
          visibility: 'private',
          workshopId: 'ws-1',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    const next = putImportedPath(
      lib,
      {
        id: '',
        name: 'Published title',
        visibility: 'public',
        tags: [],
        workshopId: 'ws-1',
        nodes: [
          { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
          { id: 't1', type: 'track', position: { x: 80, y: 0 }, data: {} },
        ],
        edges: [],
        updatedAt: '2026-10-03T00:00:00.000Z',
      },
      { keepName: true }
    );
    expect(next.paths).toHaveLength(1);
    expect(next.paths[0].id).toBe('p1');
    expect(next.paths[0].name).toBe('Mine');
    expect(next.paths[0].visibility).toBe('public');
    expect(next.paths[0].nodes).toHaveLength(2);
  });

  it('links workshop visibility onto the source path', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Mine',
          visibility: 'private',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    const next = linkPathWorkshop(lib, { pathId: 'p1' }, { workshopId: 'ws-1', visibility: 'unlisted' });
    expect(next.paths[0].workshopId).toBe('ws-1');
    expect(next.paths[0].visibility).toBe('unlisted');
    expect(findPathForWorkshop(next.paths, { workshopId: 'ws-1' })?.id).toBe('p1');
  });

  it('prefers the workshop-bound path over an older source path id', () => {
    const paths = [
      { id: 'source-old' },
      { id: 'current', workshopId: 'ws-1' },
    ];
    expect(
      findPathForWorkshop(paths, {
        workshopId: 'ws-1',
        sourcePathId: 'source-old',
        preferId: 'current',
      })?.id
    ).toBe('current');
    expect(
      findPathForWorkshop(paths, { workshopId: 'ws-1', sourcePathId: 'source-old' })?.id
    ).toBe('current');
  });

  it('replaces the active playlist graph and keeps the same path id', () => {
    const lib = parseLibrary({
      schemaVersion: 1,
      activeId: 'p1',
      paths: [
        {
          id: 'p1',
          name: 'Mine',
          visibility: 'public',
          workshopId: 'ws-1',
          nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        },
      ],
    });
    const next = replaceActiveGraph(lib, {
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: 't1', type: 'track', position: { x: 80, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'start', target: 't1' }],
    });
    expect(next.paths).toHaveLength(1);
    expect(next.activeId).toBe('p1');
    expect(next.paths[0].name).toBe('Mine');
    expect(next.paths[0].workshopId).toBe('ws-1');
    expect(next.paths[0].visibility).toBe('public');
    expect(next.paths[0].nodes.map((n) => n.id)).toEqual(['start', 't1']);
    expect(next.paths[0].edges).toHaveLength(1);
  });
});
