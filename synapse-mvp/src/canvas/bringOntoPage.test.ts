import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { bringNodesOntoPage, PAGE_ORIGIN } from './bringOntoPage';

function node(
  id: string,
  type: string,
  x: number,
  y: number,
  data: Record<string, unknown> = {}
): Node {
  return { id, type, position: { x, y }, data };
}

describe('bringNodesOntoPage', () => {
  it('moves the selection as one group onto the page origin', () => {
    const nodes = [
      node('a', 'randomizer', 800, 400, { name: 'travel' }),
      node('b', 'randomizer', 1000, 420, { name: 'childhood' }),
    ];
    const next = bringNodesOntoPage(nodes, [], 'selected', ['a', 'b']);
    expect(next).not.toBeNull();
    const a = next!.nodes.find((item) => item.id === 'a')!;
    const b = next!.nodes.find((item) => item.id === 'b')!;
    expect(a.position).toEqual({ x: PAGE_ORIGIN.x, y: PAGE_ORIGIN.y });
    expect(b.position.x - a.position.x).toBe(200);
    expect(b.position.y - a.position.y).toBe(20);
  });

  it('packs named groups together and leaves unnamed nodes', () => {
    const nodes = [
      node('travel-1', 'randomizer', 900, 50, { name: 'travel' }),
      node('travel-2', 'track', 1200, 80, { name: 'travel' }),
      node('other', 'track', 40, 900, {}),
    ];
    const next = bringNodesOntoPage(nodes, [], 'all', []);
    const t1 = next!.nodes.find((item) => item.id === 'travel-1')!;
    const t2 = next!.nodes.find((item) => item.id === 'travel-2')!;
    const other = next!.nodes.find((item) => item.id === 'other')!;
    expect(t1.position).toEqual({ x: PAGE_ORIGIN.x, y: PAGE_ORIGIN.y });
    expect(t2.position.x - t1.position.x).toBe(300);
    expect(other.position).toEqual({ x: 40, y: 900 });
  });

  it('does not merge different names into one group', () => {
    const nodes = [
      node('a', 'randomizer', 0, 0, { name: 'travel' }),
      node('b', 'randomizer', 0, 800, { name: 'techno' }),
    ];
    const next = bringNodesOntoPage(nodes, [], 'all', []);
    const a = next!.nodes.find((item) => item.id === 'a')!;
    const b = next!.nodes.find((item) => item.id === 'b')!;
    expect(a.position.y).toBe(PAGE_ORIGIN.y);
    expect(b.position.x).toBeGreaterThan(a.position.x);
    expect(b.position.y).toBe(PAGE_ORIGIN.y);
  });

  it('falls back to connected components when nothing is named', () => {
    const nodes = [
      node('a', 'start', 500, 500),
      node('b', 'track', 800, 500),
      node('c', 'track', 50, 50),
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const next = bringNodesOntoPage(nodes, edges, 'all', []);
    const a = next!.nodes.find((item) => item.id === 'a')!;
    const b = next!.nodes.find((item) => item.id === 'b')!;
    expect(b.position.x - a.position.x).toBe(300);
    expect(b.position.y - a.position.y).toBe(0);
  });
});
