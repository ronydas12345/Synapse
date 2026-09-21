import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  applyPaste,
  collectCopySet,
  parseNodeClipboard,
  NODE_CLIPBOARD_TYPE,
} from './clipboard';

function node(
  id: string,
  type: string,
  extra: Partial<Node> = {}
): Node {
  return {
    id,
    type,
    position: { x: 10, y: 20 },
    data: {},
    ...extra,
  };
}

describe('canvas clipboard', () => {
  it('copies selected nodes and edges between them', () => {
    const nodes = [node('a', 'track'), node('b', 'end'), node('c', 'track')];
    const edges: Edge[] = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'c-b', source: 'c', target: 'b' },
    ];
    const clip = collectCopySet(nodes, edges, ['a', 'b']);
    expect(clip?.nodes.map((row) => row.id).sort()).toEqual(['a', 'b']);
    expect(clip?.edges.map((row) => row.id)).toEqual(['a-b']);
  });

  it('includes parked randomizer tracks even if they were not selected', () => {
    const nodes = [
      node('r1', 'randomizer', { data: { tracks: ['t-hidden'] } }),
      node('t-hidden', 'track', { hidden: true }),
    ];
    const clip = collectCopySet(nodes, [], ['r1']);
    expect(clip?.nodes.map((row) => row.id).sort()).toEqual(['r1', 't-hidden']);
  });

  it('pastes with new ids, offset, and remapped track lists', () => {
    const existing = [node('start', 'start')];
    const clip = collectCopySet(
      [
        node('r1', 'randomizer', {
          position: { x: 0, y: 0 },
          data: { tracks: ['t1'] },
        }),
        node('t1', 'track', { hidden: true, position: { x: 8, y: 8 } }),
      ],
      [{ id: 'e1', source: 'r1', target: 't1' }],
      ['r1']
    );
    expect(clip).not.toBeNull();
    const next = applyPaste(existing, [], clip!, { x: 40, y: 40 }, 1000);
    expect(next.nodes).toHaveLength(3);
    const randomizer = next.nodes.find((row) => row.type === 'randomizer');
    const parked = next.nodes.find((row) => row.type === 'track');
    expect(randomizer?.id).not.toBe('r1');
    expect(parked?.id).not.toBe('t1');
    expect(randomizer?.position).toEqual({ x: 40, y: 40 });
    expect((randomizer?.data as { tracks: string[] }).tracks).toEqual([parked?.id]);
    expect(next.edges[0].source).toBe(randomizer?.id);
    expect(next.selectedIds).toEqual([randomizer?.id, parked?.id]);
  });

  it('rejects unrelated JSON', () => {
    expect(parseNodeClipboard('{"type":"nope"}')).toBeNull();
    expect(
      parseNodeClipboard(
        JSON.stringify({ type: NODE_CLIPBOARD_TYPE, nodes: [], edges: [] })
      )?.type
    ).toBe(NODE_CLIPBOARD_TYPE);
  });
});
