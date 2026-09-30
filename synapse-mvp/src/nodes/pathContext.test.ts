import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  neighborLabels,
  queuePosition,
  resolveInspectorNodeId,
  sequencesContaining,
} from './pathContext';

function node(
  id: string,
  type: string,
  data: Record<string, unknown> = {}
): Node {
  return { id, type, position: { x: 0, y: 0 }, data };
}

describe('pathContext', () => {
  it('lists sequences that contain a track, with index', () => {
    const nodes = [
      node('seq', 'randomizer', {
        mode: 'sequence',
        name: 'travel',
        tracks: ['t1', 't2'],
      }),
      node('rnd', 'randomizer', { mode: 'randomizer', tracks: ['t2'] }),
      node('t2', 'track', { songTitle: 'Song' }),
    ];
    const found = sequencesContaining(nodes, 't2');
    expect(found).toEqual([
      { id: 'seq', name: 'travel', mode: 'sequence', index: 1, total: 2 },
      { id: 'rnd', name: 'Randomizer', mode: 'randomizer', index: 0, total: 1 },
    ]);
  });

  it('does not treat a different sequence as the owner', () => {
    const nodes = [
      node('seq', 'randomizer', { name: 'childhood', tracks: ['other'] }),
      node('t1', 'track', {}),
    ];
    expect(sequencesContaining(nodes, 't1')).toEqual([]);
  });

  it('labels graph neighbors', () => {
    const nodes = [
      node('start', 'start', { name: 'Intro' }),
      node('t1', 'track', { songTitle: 'Song' }),
    ];
    const edges: Edge[] = [{ id: 'e', source: 'start', target: 't1' }];
    expect(neighborLabels(nodes, edges, 't1')).toEqual({
      incoming: ['Intro'],
      outgoing: [],
    });
  });

  it('finds queue position from playback keys', () => {
    expect(queuePosition(['track:a', 'track:b', 'track:c'], 'b')).toEqual({
      index: 1,
      total: 3,
    });
    expect(queuePosition(['track:a'], 'missing')).toBeNull();
  });

  it('keeps a parked track in the inspector while its sequence stays selected', () => {
    const nodes = [
      node('seq', 'randomizer', { name: 'travel', tracks: ['t1'] }),
      node('t1', 'track', {}),
    ];
    expect(resolveInspectorNodeId(nodes, ['seq'], 't1')).toBe('t1');
    expect(resolveInspectorNodeId(nodes, ['seq'], 'seq')).toBe('seq');
    expect(resolveInspectorNodeId(nodes, [], 't1')).toBeNull();
    expect(resolveInspectorNodeId(nodes, ['seq', 'other'], 't1')).toBeNull();
    expect(resolveInspectorNodeId(nodes, ['other'], 't1')).toBe('other');
  });
});
