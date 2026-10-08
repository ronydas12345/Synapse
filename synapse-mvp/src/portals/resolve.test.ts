import { describe, expect, it } from 'vitest';
import { makeEdge, makeNode } from '../engine/graphFixtures';
import { defaultPlaylistPortalPolicy } from './parse';
import { resolvePortalHop, type PortalCatalogPlaylist } from './resolve';

function playlist(
  partial: Partial<PortalCatalogPlaylist> & Pick<PortalCatalogPlaylist, 'id' | 'nodes' | 'edges'>
): PortalCatalogPlaylist {
  return {
    name: partial.name || partial.id,
    visibility: partial.visibility || 'public',
    owner: partial.owner ?? true,
    portalPolicy: partial.portalPolicy ?? defaultPlaylistPortalPolicy(partial.visibility || 'public'),
    workshopId: partial.workshopId,
    id: partial.id,
    nodes: partial.nodes,
    edges: partial.edges,
  };
}

describe('resolvePortalHop', () => {
  it('routes an exit portal to another playlist start', () => {
    const sourcePortal = makeNode('pa', 'portal', {
      portalId: 'P-SRC11SRC',
      destination: { type: 'internal', playlistId: 'b', mode: 'playlist_start', portalId: '' },
    });
    const source = playlist({
      id: 'a',
      nodes: [makeNode('start', 'start'), makeNode('t1', 'track'), sourcePortal],
      edges: [makeEdge('start', 't1'), makeEdge('t1', 'pa')],
    });
    const dest = playlist({
      id: 'b',
      nodes: [makeNode('start', 'start'), makeNode('t2', 'track')],
      edges: [makeEdge('start', 't2')],
    });
    const result = resolvePortalHop({
      source,
      portalNode: sourcePortal,
      catalog: [source, dest],
      context: { visited: [], hops: 0 },
      editor: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.landingNodeId).toBe('start');
  });

  it('lands on an entry portal outgoing route', () => {
    const sourcePortal = makeNode('pa', 'portal', {
      portalId: 'P-SRC11SRC',
      destination: {
        type: 'internal',
        playlistId: 'b',
        mode: 'portal',
        portalId: 'P-DST11DST',
      },
    });
    const destPortal = makeNode('pb', 'portal', { portalId: 'P-DST11DST' });
    const source = playlist({
      id: 'a',
      nodes: [makeNode('t1', 'track'), sourcePortal],
      edges: [makeEdge('t1', 'pa')],
    });
    const dest = playlist({
      id: 'b',
      nodes: [makeNode('start', 'start'), destPortal, makeNode('t2', 'track')],
      edges: [makeEdge('pb', 't2')],
    });
    const result = resolvePortalHop({
      source,
      portalNode: sourcePortal,
      catalog: [source, dest],
      context: { visited: [], hops: 0 },
      editor: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.landingNodeId).toBe('pb');
  });

  it('denies private destinations for non-owners', () => {
    const sourcePortal = makeNode('pa', 'portal', {
      portalId: 'P-SRC11SRC',
      destination: { type: 'internal', playlistId: 'b', mode: 'playlist_start', portalId: '' },
    });
    const source = playlist({
      id: 'a',
      owner: true,
      nodes: [makeNode('t1', 'track'), sourcePortal],
      edges: [makeEdge('t1', 'pa')],
    });
    const dest = playlist({
      id: 'b',
      owner: false,
      visibility: 'private',
      nodes: [makeNode('start', 'start')],
      edges: [],
    });
    const result = resolvePortalHop({
      source,
      portalNode: sourcePortal,
      catalog: [source, dest],
      context: { visited: [], hops: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('PORTAL_DESTINATION_PRIVATE');
  });

  it('denies unlisted playlists when portals are disabled', () => {
    const sourcePortal = makeNode('pa', 'portal', {
      portalId: 'P-SRC11SRC',
      destination: { type: 'internal', playlistId: 'b', mode: 'playlist_start', portalId: '' },
    });
    const source = playlist({
      id: 'a',
      owner: false,
      nodes: [makeNode('t1', 'track'), sourcePortal],
      edges: [makeEdge('t1', 'pa')],
    });
    const dest = playlist({
      id: 'b',
      owner: false,
      visibility: 'unlisted',
      portalPolicy: defaultPlaylistPortalPolicy('unlisted'),
      nodes: [makeNode('start', 'start')],
      edges: [],
    });
    const result = resolvePortalHop({
      source,
      portalNode: sourcePortal,
      catalog: [source, dest],
      context: { visited: [], hops: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('PORTAL_UNLISTED_DISABLED');
  });

  it('stops self-targets and loops', () => {
    const sourcePortal = makeNode('pa', 'portal', {
      portalId: 'P-SRC11SRC',
      destination: {
        type: 'internal',
        playlistId: 'a',
        mode: 'portal',
        portalId: 'P-SRC11SRC',
      },
    });
    const source = playlist({
      id: 'a',
      nodes: [makeNode('t1', 'track'), sourcePortal, makeNode('t2', 'track')],
      edges: [makeEdge('t1', 'pa'), makeEdge('pa', 't2')],
    });
    const bothWired = resolvePortalHop({
      source,
      portalNode: sourcePortal,
      catalog: [source],
      context: { visited: [], hops: 0 },
      editor: true,
    });
    expect(bothWired.ok).toBe(false);

    const exitOnly = playlist({
      id: 'a',
      nodes: [makeNode('t1', 'track'), sourcePortal],
      edges: [makeEdge('t1', 'pa')],
    });
    const self = resolvePortalHop({
      source: exitOnly,
      portalNode: sourcePortal,
      catalog: [exitOnly],
      context: { visited: [], hops: 0 },
      editor: true,
    });
    expect(self.ok).toBe(false);
    if (!self.ok) expect(self.code).toBe('PORTAL_SELF_TARGET');

    const loop = resolvePortalHop({
      source: exitOnly,
      portalNode: makeNode('pa', 'portal', {
        portalId: 'P-SRC11SRC',
        destination: { type: 'internal', playlistId: 'b', mode: 'playlist_start', portalId: '' },
      }),
      catalog: [
        exitOnly,
        playlist({
          id: 'b',
          nodes: [makeNode('start', 'start')],
          edges: [],
        }),
      ],
      context: { visited: ['b:P-SRC11SRC'], hops: 1 },
      editor: true,
    });
    expect(loop.ok).toBe(false);
    if (!loop.ok) expect(loop.code).toBe('PORTAL_LOOP_DETECTED');
  });
});
