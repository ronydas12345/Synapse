import { describe, expect, it } from 'vitest';
import { graph, makeEdge, makeNode } from '../engine/graphFixtures';
import { collectUpstreamStyleNodes } from './upstream';

describe('collectUpstreamStyleNodes', () => {
  it('collects style nodes before a jumped-to track, excluding the origin', () => {
    const g = graph(
      [
        makeNode('start', 'start'),
        makeNode('look', 'style', { themeId: 'cherry-tree' }),
        makeNode('t1', 'track'),
      ],
      [makeEdge('start', 'look'), makeEdge('look', 't1')]
    );
    expect(
      collectUpstreamStyleNodes(g.nodes, g.edges, 't1').map((n) => n.id)
    ).toEqual(['look']);
    expect(collectUpstreamStyleNodes(g.nodes, g.edges, 'look')).toEqual([]);
    expect(collectUpstreamStyleNodes(g.nodes, g.edges, 'start')).toEqual([]);
  });

  it('keeps start-to-origin order when several styles sit on the path', () => {
    const g = graph(
      [
        makeNode('start', 'start'),
        makeNode('a', 'style', { themeId: 'cherry-tree' }),
        makeNode('b', 'style', { themeId: 'midnight' }),
        makeNode('t1', 'track'),
      ],
      [
        makeEdge('start', 'a'),
        makeEdge('a', 'b'),
        makeEdge('b', 't1'),
      ]
    );
    expect(
      collectUpstreamStyleNodes(g.nodes, g.edges, 't1').map((n) => n.id)
    ).toEqual(['a', 'b']);
  });

  it('walks through a randomizer to styles behind a parked track', () => {
    const g = graph(
      [
        makeNode('start', 'start'),
        makeNode('look', 'style', { themeId: 'midnight' }),
        makeNode('rnd', 'randomizer', { tracks: ['hidden'] }),
        makeNode('hidden', 'track'),
      ],
      [makeEdge('start', 'look'), makeEdge('look', 'rnd')]
    );
    expect(
      collectUpstreamStyleNodes(g.nodes, g.edges, 'hidden').map((n) => n.id)
    ).toEqual(['look']);
  });
});
