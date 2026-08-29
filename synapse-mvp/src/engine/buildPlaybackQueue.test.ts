import { describe, expect, it } from 'vitest';
import { buildPlaybackQueue, buildPlaybackQueueKeys } from './buildPlaybackQueue';
import { graph, makeEdge, makeNode } from './graphFixtures';
import { createSeededRng } from './rng';

const start = () => makeNode('start', 'start', { label: 'Start' });
const track = (id: string, extra: Record<string, unknown> = {}) =>
  makeNode(id, 'track', { videoId: id, ...extra });

describe('buildPlaybackQueue', () => {
  it('returns an empty queue when there is no start node', () => {
    const g = graph([track('a')], []);
    expect(buildPlaybackQueue(g)).toEqual([]);
  });

  it('returns an empty queue for start with no outgoing tracks', () => {
    const g = graph([start(), makeNode('end', 'end')], [makeEdge('start', 'end')]);
    expect(buildPlaybackQueueKeys(g)).toEqual([]);
  });

  it('walks a straight Start → Track → End path', () => {
    const g = graph(
      [start(), track('t1'), makeNode('end', 'end')],
      [makeEdge('start', 't1'), makeEdge('t1', 'end')]
    );
    expect(buildPlaybackQueueKeys(g, { rng: createSeededRng(1) })).toEqual([
      'track:t1',
    ]);
  });

  it('repeats a track according to playCount', () => {
    const g = graph(
      [start(), track('t1', { playCount: 3 })],
      [makeEdge('start', 't1')]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual([
      'track:t1',
      'track:t1',
      'track:t1',
    ]);
  });

  it('inserts transition nodes between tracks', () => {
    const g = graph(
      [
        start(),
        track('t1'),
        makeNode('xf', 'transition', { mode: 'silence' }),
        track('t2'),
      ],
      [
        makeEdge('start', 't1'),
        makeEdge('t1', 'xf'),
        makeEdge('xf', 't2'),
      ]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual([
      'track:t1',
      'transition:xf',
      'track:t2',
    ]);
  });

  it('does not follow a cycle through a non-splitter node', () => {
    const g = graph(
      [start(), track('t1'), track('t2')],
      [
        makeEdge('start', 't1'),
        makeEdge('t1', 't2'),
        makeEdge('t2', 't1'),
      ]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual(['track:t1', 'track:t2']);
  });

  it('skips missing node ids on dangling edges', () => {
    const g = graph(
      [start(), track('t1')],
      [makeEdge('start', 'missing'), makeEdge('start', 't1')]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual(['track:t1']);
  });

  it('still queues a track node with no videoId', () => {
    const g = graph(
      [start(), makeNode('broken', 'track', {})],
      [makeEdge('start', 'broken')]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual(['track:broken']);
  });

  it('picks a weighted splitter branch deterministically', () => {
    const splitter = makeNode('split', 'splitter', {
      mode: 'random',
      weights: [1, 99],
    });
    const g = graph(
      [start(), splitter, track('a'), track('b')],
      [
        makeEdge('start', 'split'),
        makeEdge('split', 'a', 'A'),
        makeEdge('split', 'b', 'B'),
      ]
    );
    const alwaysFirst = () => 0;
    const alwaysSecond = () => 0.999;
    expect(buildPlaybackQueueKeys(g, { rng: alwaysFirst })).toEqual(['track:a']);
    expect(buildPlaybackQueueKeys(g, { rng: alwaysSecond })).toEqual([
      'track:b',
    ]);
  });

  it('treats invalid splitter weights as the first branch', () => {
    const splitter = makeNode('split', 'splitter', {
      mode: 'random',
      weights: [0, 0],
    });
    const g = graph(
      [start(), splitter, track('a'), track('b')],
      [
        makeEdge('start', 'split'),
        makeEdge('split', 'a', 'A'),
        makeEdge('split', 'b', 'B'),
      ]
    );
    expect(buildPlaybackQueueKeys(g, { rng: () => 0.5 })).toEqual(['track:a']);
  });

  it('returns empty when the chosen splitter handle has no edge', () => {
    const splitter = makeNode('split', 'splitter', {
      mode: 'random',
      weights: [1, 1],
    });
    const g = graph(
      [start(), splitter, track('b')],
      [makeEdge('start', 'split'), makeEdge('split', 'b', 'B')]
    );
    expect(buildPlaybackQueueKeys(g, { rng: () => 0 })).toEqual([]);
  });

  it('selects a time-range branch using injected currentHour', () => {
    const splitter = makeNode('split', 'conditional', {
      mode: 'timeRange',
      weights: [1, 1],
      pathTimeRanges: [[{ start: 6, end: 11 }], [{ start: 20, end: 23 }]],
    });
    const g = graph(
      [start(), splitter, track('day'), track('night')],
      [
        makeEdge('start', 'split'),
        makeEdge('split', 'day', 'A'),
        makeEdge('split', 'night', 'B'),
      ]
    );
    expect(buildPlaybackQueueKeys(g, { currentHour: 9 })).toEqual([
      'track:day',
    ]);
    expect(buildPlaybackQueueKeys(g, { currentHour: 21 })).toEqual([
      'track:night',
    ]);
  });

  it('handles overnight time ranges wrapping midnight', () => {
    const splitter = makeNode('split', 'conditional', {
      mode: 'timeRange',
      weights: [1, 1],
      pathTimeRanges: [[{ start: 22, end: 2 }], [{ start: 3, end: 21 }]],
    });
    const g = graph(
      [start(), splitter, track('late'), track('day')],
      [
        makeEdge('start', 'split'),
        makeEdge('split', 'late', 'A'),
        makeEdge('split', 'day', 'B'),
      ]
    );
    expect(buildPlaybackQueueKeys(g, { currentHour: 23 })).toEqual([
      'track:late',
    ]);
    expect(buildPlaybackQueueKeys(g, { currentHour: 1 })).toEqual([
      'track:late',
    ]);
    expect(buildPlaybackQueueKeys(g, { currentHour: 10 })).toEqual([
      'track:day',
    ]);
  });

  it('plays randomizer tracks in sequence', () => {
    const rnd = makeNode('rnd', 'randomizer', {
      mode: 'sequence',
      tracks: ['t1', 't2'],
      playCount: 2,
    });
    const g = graph(
      [start(), rnd, track('t1'), track('t2')],
      [makeEdge('start', 'rnd')]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual([
      'track:t1',
      'track:t2',
      'track:t1',
      'track:t2',
    ]);
  });

  it('picks randomizer tracks by weight with a seeded rng', () => {
    const rnd = makeNode('rnd', 'randomizer', {
      mode: 'weighted',
      tracks: ['t1', 't2'],
      weights: [1, 99],
      playCount: 1,
    });
    const g = graph(
      [start(), rnd, track('t1'), track('t2')],
      [makeEdge('start', 'rnd')]
    );
    expect(buildPlaybackQueueKeys(g, { rng: () => 0.999 })).toEqual([
      'track:t2',
    ]);
  });

  it('caps forever randomizers at a single pass through sequence mode', () => {
    const rnd = makeNode('rnd', 'randomizer', {
      mode: 'sequence',
      tracks: ['t1'],
      playCount: 50,
      isForever: true,
    });
    const g = graph(
      [start(), rnd, track('t1')],
      [makeEdge('start', 'rnd')]
    );
    expect(buildPlaybackQueueKeys(g)).toEqual(['track:t1']);
  });

  it('is deterministic for the same seed on a weighted path', () => {
    const splitter = makeNode('split', 'splitter', {
      mode: 'random',
      weights: [40, 60],
    });
    const g = graph(
      [start(), splitter, track('a'), track('b')],
      [
        makeEdge('start', 'split'),
        makeEdge('split', 'a', 'A'),
        makeEdge('split', 'b', 'B'),
      ]
    );
    const q1 = buildPlaybackQueueKeys(g, { rng: createSeededRng(123) });
    const q2 = buildPlaybackQueueKeys(g, { rng: createSeededRng(123) });
    expect(q1).toEqual(q2);
  });
});
