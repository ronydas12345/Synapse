import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  PACKAGE_TYPE,
  PLAYLIST_TYPE,
  ZIP_PLAYLIST_ERROR,
  collectDependentCustomThemes,
  parsePlaylistDocument,
  parsePlaylistFile,
  playlistDownloadName,
  remapStyleNodeThemeIds,
  serializePackageJson,
  serializePlaylistJson,
} from './format';
import type { StoredMusicPath } from './library';
import { BUILTIN_THEMES } from '../theme/presets';
import { themeToJson } from '../theme/parseTheme';

function samplePath(overrides?: Partial<StoredMusicPath>): StoredMusicPath {
  const nodes: Node[] = [
    { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    {
      id: 'track-1',
      type: 'track',
      position: { x: 200, y: 0 },
      data: { videoId: 'dQw4w9wgGcQ', songTitle: 'Never Gonna Give You Up' },
    },
  ];
  const edges: Edge[] = [{ id: 'e1', source: 'start', target: 'track-1' }];
  return {
    id: 'path-abc',
    name: 'Late Night Focus',
    visibility: 'private',
    updatedAt: '2026-09-06T00:00:00.000Z',
    nodes,
    edges,
    ...overrides,
  };
}

describe('playlist file format', () => {
  it('round-trips a playlist through .synapse JSON', () => {
    const path = samplePath();
    const json = serializePlaylistJson(path, { themeId: 'standard-dark' });
    const parsed = parsePlaylistFile(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.playlist.name).toBe('Late Night Focus');
    expect(parsed.playlist.nodes.map((n) => n.id)).toEqual(['start', 'track-1']);
    expect(parsed.playlist.edges[0]?.source).toBe('start');
    expect(parsed.themeId).toBe('standard-dark');
    expect(JSON.parse(json).type).toBe(PLAYLIST_TYPE);
  });

  it('accepts the legacy portable path shape', () => {
    const parsed = parsePlaylistDocument({
      version: 1,
      name: 'Legacy Mix',
      nodes: [{ id: 'start', type: 'start', position: { x: 1, y: 2 }, data: {} }],
      edges: [],
      settings: {},
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.playlist.name).toBe('Legacy Mix');
    expect(parsed.packaged).toBe(false);
  });

  it('round-trips a package with a theme and skips overlays with a notice', () => {
    const json = serializePackageJson(samplePath(), [BUILTIN_THEMES[0]], {
      themeId: BUILTIN_THEMES[0].id,
    });
    const withOverlays = JSON.parse(json);
    withOverlays.manifest.overlays = ['overlays/rain.gif'];
    withOverlays.type = PACKAGE_TYPE;
    const parsed = parsePlaylistDocument(withOverlays);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.packaged).toBe(true);
    expect(parsed.themes[0]?.id).toBe(BUILTIN_THEMES[0].id);
    expect(parsed.notices.some((n) => n.toLowerCase().includes('overlay'))).toBe(true);
  });

  it('rejects junk, theme files, zip bytes, and XSS names', () => {
    expect(parsePlaylistFile('{').ok).toBe(false);
    expect(parsePlaylistDocument({ hello: true }).ok).toBe(false);
    const theme = parsePlaylistFile(themeToJson(BUILTIN_THEMES[0]));
    expect(theme.ok).toBe(false);
    if (!theme.ok) expect(theme.error).toMatch(/theme file/i);

    const zip = parsePlaylistFile('PK\u0003\u0004not-a-playlist');
    expect(zip.ok).toBe(false);
    if (!zip.ok) expect(zip.error).toBe(ZIP_PLAYLIST_ERROR);

    const xss = parsePlaylistDocument({
      schemaVersion: 1,
      type: PLAYLIST_TYPE,
      name: '<script>alert(1)</script>Focus',
      nodes: [],
      edges: [],
    });
    expect(xss.ok).toBe(true);
    if (!xss.ok) return;
    expect(xss.playlist.name).not.toMatch(/[<>]/);
    expect(xss.playlist.name).toContain('Focus');
  });

  it('drops unknown node types and remaps id references', () => {
    const parsed = parsePlaylistDocument({
      schemaVersion: 1,
      type: PLAYLIST_TYPE,
      name: 'Graph',
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: '../evil', type: 'track', position: { x: 10, y: 0 }, data: { videoId: 'abc' } },
        { id: 'rnd', type: 'randomizer', position: { x: 20, y: 0 }, data: { tracks: ['../evil'] } },
        { id: 'hack', type: 'eval-node', position: { x: 0, y: 0 }, data: { run: 'nope' } },
      ],
      edges: [{ id: 'e', source: 'start', target: '../evil' }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.playlist.nodes.some((n) => n.type === 'eval-node')).toBe(false);
    expect(parsed.playlist.nodes.some((n) => n.id.includes('..'))).toBe(false);
    const randomizer = parsed.playlist.nodes.find((n) => n.type === 'randomizer');
    const tracks = (randomizer?.data as { tracks?: string[] })?.tracks || [];
    expect(tracks.length).toBe(1);
    expect(tracks[0]).not.toContain('..');
    expect(parsed.notices.some((n) => n.includes('unsupported'))).toBe(true);
  });

  it('keeps style nodes on import', () => {
    const parsed = parsePlaylistDocument({
      schemaVersion: 1,
      type: PLAYLIST_TYPE,
      name: 'Themed',
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'look',
          type: 'style',
          position: { x: 80, y: 0 },
          data: { themeId: 'cherry-tree', durationMs: 600, easing: 'easeInOut' },
        },
      ],
      edges: [{ id: 'e', source: 'start', target: 'look' }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.playlist.nodes.some((n) => n.type === 'style')).toBe(true);
  });

  it('embeds custom Style-node themes on playlist and package export', () => {
    const custom = { ...BUILTIN_THEMES[0], id: 'custom-ocean', name: 'Ocean', builtin: false };
    const path = samplePath({
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
        {
          id: 'look',
          type: 'style',
          position: { x: 80, y: 0 },
          data: { themeId: 'custom-ocean', durationMs: 600, easing: 'easeInOut' },
        },
      ],
      edges: [{ id: 'e', source: 'start', target: 'look' }],
    });
    const deps = collectDependentCustomThemes(path.nodes, [custom], ['standard-dark']);
    expect(deps.map((t) => t.id)).toEqual(['custom-ocean']);

    const playlist = parsePlaylistFile(
      serializePlaylistJson(path, { themeId: 'standard-dark', themes: deps })
    );
    expect(playlist.ok).toBe(true);
    if (!playlist.ok) return;
    expect(playlist.themes.map((t) => t.id)).toEqual(['custom-ocean']);

    const pkg = parsePlaylistFile(serializePackageJson(path, deps, { themeId: 'standard-dark' }));
    expect(pkg.ok).toBe(true);
    if (!pkg.ok) return;
    expect(pkg.packaged).toBe(true);
    expect(pkg.themes.map((t) => t.id)).toEqual(['custom-ocean']);
  });

  it('remaps Style node theme ids after a colliding import', () => {
    const nodes: Node[] = [
      {
        id: 'look',
        type: 'style',
        position: { x: 0, y: 0 },
        data: { themeId: 'custom-ocean' },
      },
    ];
    const remapped = remapStyleNodeThemeIds(nodes, new Map([['custom-ocean', 'custom-ocean-2']]));
    expect((remapped[0]?.data as { themeId?: string }).themeId).toBe('custom-ocean-2');
  });

  it('strips functions from node data', () => {
    const parsed = parsePlaylistDocument({
      schemaVersion: 1,
      type: PLAYLIST_TYPE,
      name: 'Safe',
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', onPlay: () => 'nope' },
        },
      ],
      edges: [],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(typeof (parsed.playlist.nodes[0]?.data as { onPlay?: unknown })?.onPlay).not.toBe(
      'function'
    );
  });

  it('builds a download slug', () => {
    expect(playlistDownloadName('Late Night Focus')).toBe('late-night-focus.synapse');
    expect(playlistDownloadName('@@@')).toBe('playlist.synapse');
  });
});
