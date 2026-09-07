import { describe, expect, it } from 'vitest';
import { graph, makeEdge, makeNode } from './engine/graphFixtures';
import { buildPlaybackQueueKeys } from './engine';
import {
  branchesFromNode,
  buildListenRows,
  collectArmItems,
  findSplitOwner,
  weightPercents,
} from './listenPath';

describe('listenPath', () => {
  it('converts weights to percents', () => {
    expect(weightPercents([70, 30])).toEqual([70, 30]);
    expect(weightPercents([1, 1])).toEqual([50, 50]);
  });

  it('lists randomizer branches with weights', () => {
    const a = makeNode('a', 'track', { songTitle: 'Track A' });
    const b = makeNode('b', 'track', { songTitle: 'Track B' });
    const rnd = makeNode('r', 'randomizer', {
      mode: 'randomizer',
      tracks: ['a', 'b'],
      weights: [70, 30],
    });
    const split = branchesFromNode(rnd, [a, b, rnd], []);
    expect(split?.modeLabel).toBe('Weighted Random');
    expect(split?.options.map((o) => o.nodeId)).toEqual(['a', 'b']);
    expect(split?.options.map((o) => o.detail)).toEqual(['70%', '30%']);
  });

  it('lists conditional branches with path letters', () => {
    const a = makeNode('a', 'track', { songTitle: 'Left' });
    const b = makeNode('b', 'track', { songTitle: 'Right' });
    const spl = makeNode('spl', 'conditional', {
      mode: 'random',
      weights: [70, 30],
    });
    const edges = [makeEdge('spl', 'a', 'A'), makeEdge('spl', 'b', 'B')];
    const split = branchesFromNode(spl, [a, b, spl], edges);
    expect(split?.options[0].label).toContain('Left');
    expect(split?.options[1].detail).toBe('30%');
  });

  it('finds split owners for parked randomizer tracks and conditional edges', () => {
    const a = makeNode('a', 'track', { songTitle: 'A' });
    const rnd = makeNode('r', 'randomizer', { tracks: ['a'] });
    expect(findSplitOwner('a', [a, rnd], [])?.id).toBe('r');

    const b = makeNode('b', 'track', { songTitle: 'B' });
    const spl = makeNode('spl', 'conditional', { weights: [1, 1] });
    const edges = [makeEdge('spl', 'b', 'A')];
    expect(findSplitOwner('b', [b, spl], edges)?.id).toBe('spl');

    const a2 = makeNode('a2', 'track', { songTitle: 'A2' });
    const aHead = makeNode('a', 'track', { songTitle: 'A' });
    const deep = [makeEdge('spl', 'a', 'A'), makeEdge('a', 'a2')];
    expect(findSplitOwner('a2', [aHead, a2, spl], deep)?.id).toBe('spl');
  });

  it('marks the current song and upcoming queue items', () => {
    const start = makeNode('start', 'start');
    const t1 = makeNode('t1', 'track', { songTitle: 'One', artist: 'A' });
    const t2 = makeNode('t2', 'track', { songTitle: 'Two', artist: 'B' });
    const g = graph(
      [start, t1, t2],
      [makeEdge('start', 't1'), makeEdge('t1', 't2')]
    );
    const queue = buildPlaybackQueueKeys(g);
    const rows = buildListenRows({
      nodes: g.nodes,
      edges: g.edges,
      queue,
      currentIndex: 0,
    });
    expect(rows[0]).toMatchObject({ type: 'start', title: 'Start', nodeId: 'start', depth: 0 });
    expect(rows[1]).toMatchObject({ kind: 'item', phase: 'now', title: 'One', depth: 1 });
    expect(rows[2]).toMatchObject({ kind: 'item', phase: 'upcoming', title: 'Two', depth: 1 });
  });

  it('inserts a split row with the chosen branch marked', () => {
    const start = makeNode('start', 'start');
    const spl = makeNode('spl', 'conditional', { mode: 'random', weights: [70, 30] });
    const a = makeNode('a', 'track', { songTitle: 'Track A' });
    const b = makeNode('b', 'track', { songTitle: 'Track B' });
    const nodes = [start, spl, a, b];
    const edges = [
      makeEdge('start', 'spl'),
      makeEdge('spl', 'a', 'A'),
      makeEdge('spl', 'b', 'B'),
    ];
    const rows = buildListenRows({
      nodes,
      edges,
      queue: ['track:a'],
      currentIndex: 0,
    });
    const split = rows.find((r) => r.kind === 'split');
    expect(split?.options?.find((o) => o.nodeId === 'a')?.chosen).toBe(true);
    expect(split?.options?.find((o) => o.nodeId === 'b')?.chosen).toBe(false);
    expect(rows.some((r) => r.kind === 'item' && r.phase === 'now' && r.nodeId === 'a')).toBe(true);
  });

  it('treats negative currentIndex as a preview (no now row)', () => {
    const t1 = makeNode('t1', 'track', { songTitle: 'One' });
    const t2 = makeNode('t2', 'track', { songTitle: 'Two' });
    const rows = buildListenRows({
      nodes: [t1, t2],
      edges: [],
      queue: ['track:t1', 'track:t2'],
      currentIndex: -1,
    });
    expect(rows.every((r) => r.phase !== 'now')).toBe(true);
    expect(rows.map((r) => r.title)).toEqual(['One', 'Two']);
  });

  it('keeps already-played nodes and splits above the current item', () => {
    const start = makeNode('start', 'start');
    const t1 = makeNode('t1', 'track', { songTitle: 'One' });
    const spl = makeNode('spl', 'conditional', { mode: 'random', weights: [70, 30] });
    const a = makeNode('a', 'track', { songTitle: 'Track A' });
    const b = makeNode('b', 'track', { songTitle: 'Track B' });
    const nodes = [start, t1, spl, a, b];
    const edges = [
      makeEdge('start', 't1'),
      makeEdge('t1', 'spl'),
      makeEdge('spl', 'a', 'A'),
      makeEdge('spl', 'b', 'B'),
    ];
    const rows = buildListenRows({
      nodes,
      edges,
      queue: ['track:t1', 'track:a'],
      currentIndex: 1,
    });
    expect(rows[0]).toMatchObject({ type: 'start', title: 'Start', depth: 0 });
    expect(rows[1]).toMatchObject({ kind: 'item', phase: 'played', title: 'One', depth: 1 });
    const split = rows.find((r) => r.kind === 'split');
    expect(split?.phase).toBe('now');
    expect(split?.depth).toBe(1);
    expect(split?.options?.find((o) => o.nodeId === 'a')?.chosen).toBe(true);
    expect(split?.options?.find((o) => o.nodeId === 'b')?.chosen).toBe(false);
    expect(rows.some((r) => r.phase === 'now' && r.nodeId === 'a' && r.depth === 2)).toBe(true);
  });

  it('lists the full sequence playlist including tracks after the split', () => {
    const start = makeNode('start', 'start');
    const a = makeNode('a', 'track', { songTitle: 'A' });
    const b = makeNode('b', 'track', { songTitle: 'B' });
    const after = makeNode('after', 'track', { songTitle: 'After' });
    const rnd = makeNode('r', 'randomizer', {
      mode: 'sequence',
      tracks: ['a', 'b'],
    });
    const nodes = [start, rnd, a, b, after];
    const edges = [makeEdge('start', 'r'), makeEdge('r', 'after')];
    const queue = buildPlaybackQueueKeys({ nodes, edges });
    const rows = buildListenRows({
      nodes,
      edges,
      queue,
      currentIndex: 0,
    });
    expect(rows.map((r) => [r.title, r.depth])).toEqual([
      ['Start', 0],
      ['Sequence', 1],
      ['A', 2],
      ['B', 2],
      ['After', 1],
    ]);
    const now = rows.find((r) => r.kind === 'item' && r.phase === 'now');
    expect(now?.nodeId).toBe('a');
    expect(rows.filter((r) => r.kind === 'item' && r.phase === 'now')).toHaveLength(1);
  });

  it('keeps the other conditional path visible after entering an arm', () => {
    const start = makeNode('start', 'start');
    const spl = makeNode('spl', 'conditional', { weights: [1, 1] });
    const a = makeNode('a', 'track', { songTitle: 'Sunny' });
    const a2 = makeNode('a2', 'track', { songTitle: 'Sunny 2' });
    const b = makeNode('b', 'track', { songTitle: 'Rainy' });
    const b2 = makeNode('b2', 'track', { songTitle: 'Rainy 2' });
    const merge = makeNode('merge', 'track', { songTitle: 'Together' });
    const nodes = [start, spl, a, a2, b, b2, merge];
    const edges = [
      makeEdge('start', 'spl'),
      makeEdge('spl', 'a', 'A'),
      makeEdge('spl', 'b', 'B'),
      makeEdge('a', 'a2'),
      makeEdge('a2', 'merge'),
      makeEdge('b', 'b2'),
      makeEdge('b2', 'merge'),
    ];
    const rainy = collectArmItems('b', ['a'], 'spl', nodes, edges);
    expect(rainy.map((item) => item.nodeId)).toEqual(['b', 'b2']);
    expect(rainy.map((item) => item.title)).toEqual(['Rainy', 'Rainy 2']);

    const rows = buildListenRows({
      nodes,
      edges,
      queue: ['track:a', 'track:a2', 'track:merge'],
      currentIndex: 1,
    });
    const split = rows.find((r) => r.kind === 'split');
    expect(split?.inside).toBe(true);
    expect(split?.options?.find((o) => o.nodeId === 'a')?.chosen).toBe(true);
    const other = split?.options?.find((o) => o.nodeId === 'b');
    expect(other?.chosen).toBe(false);
    expect(other?.items?.map((item) => item.title)).toEqual(['Rainy', 'Rainy 2']);
    expect(rows.find((r) => r.nodeId === 'a')?.depth).toBe(2);
    expect(rows.find((r) => r.nodeId === 'a2')?.depth).toBe(2);
    expect(rows.find((r) => r.nodeId === 'merge')?.depth).toBe(1);
    expect(rows.some((r) => r.kind === 'item' && r.phase === 'now' && r.nodeId === 'a2')).toBe(
      true
    );
  });
});
