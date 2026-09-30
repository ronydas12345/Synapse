import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { normalizeStackedConditionals } from './normalize';

function node(
  id: string,
  type: string,
  data: Record<string, unknown>
): Node {
  return { id, type, position: { x: 0, y: 0 }, data };
}

function edge(
  source: string,
  target: string,
  handle: string,
  extra = ''
): Edge {
  return {
    id: `${source}-${handle}-${target}${extra}`,
    source,
    target,
    sourceHandle: handle,
  };
}

describe('normalizeStackedConditionals', () => {
  it('multiplies nested weighted-random weights and reduces by gcd', () => {
    const nodes = [
      node('parent', 'conditional', { mode: 'random', numPaths: 2, weights: [70, 30] }),
      node('child', 'conditional', { mode: 'random', numPaths: 2, weights: [50, 50] }),
      node('t1', 'track', {}),
      node('t2', 'track', {}),
      node('t3', 'track', {}),
    ];
    const edges = [
      edge('parent', 'child', 'A'),
      edge('parent', 't3', 'B'),
      edge('child', 't1', 'A'),
      edge('child', 't2', 'B'),
    ];
    const next = normalizeStackedConditionals(nodes, edges);
    const parent = next.nodes.find((item) => item.id === 'parent');
    expect(next.nodes.some((item) => item.id === 'child')).toBe(false);
    expect(parent?.data).toMatchObject({
      mode: 'random',
      numPaths: 3,
      weights: [7, 7, 6],
    });
    expect(next.edges.filter((item) => item.source === 'parent').map((item) => item.target)).toEqual([
      't1',
      't2',
      't3',
    ]);
  });

  it('uses source handles, not edge insertion order, for weight indexes', () => {
    const nodes = [
      node('parent', 'conditional', { mode: 'random', numPaths: 2, weights: [70, 30] }),
      node('child', 'conditional', { mode: 'random', numPaths: 2, weights: [1, 3] }),
      node('t1', 'track', {}),
      node('t2', 'track', {}),
      node('t3', 'track', {}),
    ];
    const edges = [
      edge('parent', 't3', 'B'),
      edge('parent', 'child', 'A'),
      edge('child', 't2', 'B'),
      edge('child', 't1', 'A'),
    ];
    const next = normalizeStackedConditionals(nodes, edges);
    const parent = next.nodes.find((item) => item.id === 'parent');
    expect(parent?.data?.weights).toEqual([7, 21, 12]);
    expect(next.edges.filter((item) => item.source === 'parent').map((item) => item.target)).toEqual([
      't1',
      't2',
      't3',
    ]);
  });

  it('keeps exact 1:2:3 proportions instead of rounding 1/3 to zero', () => {
    const nodes = [
      node('parent', 'conditional', { mode: 'random', numPaths: 2, weights: [1, 1] }),
      node('child', 'conditional', { mode: 'random', numPaths: 2, weights: [1, 2] }),
      node('a', 'track', {}),
      node('b', 'track', {}),
      node('c', 'track', {}),
    ];
    const edges = [
      edge('parent', 'child', 'A'),
      edge('parent', 'c', 'B'),
      edge('child', 'a', 'A'),
      edge('child', 'b', 'B'),
    ];
    const next = normalizeStackedConditionals(nodes, edges);
    expect(next.nodes.find((item) => item.id === 'parent')?.data?.weights).toEqual([1, 2, 3]);
  });

  it('does not merge a weather conditional into a weighted-random parent', () => {
    const nodes = [
      node('parent', 'conditional', { mode: 'random', numPaths: 2, weights: [50, 50] }),
      node('weather', 'conditional', {
        mode: 'weather',
        numPaths: 2,
        pathWeather: [['clear'], ['other']],
      }),
      node('t1', 'track', {}),
      node('t2', 'track', {}),
    ];
    const edges = [
      edge('parent', 'weather', 'A'),
      edge('parent', 't2', 'B'),
      edge('weather', 't1', 'A'),
    ];
    const next = normalizeStackedConditionals(nodes, edges);
    expect(next.nodes.map((item) => item.id).sort()).toEqual(
      ['parent', 't1', 't2', 'weather'].sort()
    );
    expect(next.edges).toEqual(edges);
  });

  it('does not flatten a random child into a time-range parent', () => {
    const nodes = [
      node('parent', 'conditional', {
        mode: 'timeRange',
        numPaths: 2,
        pathTimeRanges: [[{ start: 6, end: 11 }], [{ start: 12, end: 23 }]],
      }),
      node('child', 'conditional', { mode: 'random', numPaths: 2, weights: [1, 1] }),
      node('t1', 'track', {}),
      node('t2', 'track', {}),
    ];
    const edges = [
      edge('parent', 'child', 'A'),
      edge('parent', 't2', 'B'),
      edge('child', 't1', 'A'),
    ];
    const next = normalizeStackedConditionals(nodes, edges);
    expect(next.nodes.some((item) => item.id === 'child')).toBe(true);
    expect(next.nodes.find((item) => item.id === 'parent')?.data?.mode).toBe('timeRange');
  });

  it('does not merge weather and day conditionals into each other', () => {
    const nodes = [
      node('weather', 'conditional', { mode: 'weather', numPaths: 2 }),
      node('day', 'conditional', { mode: 'day', numPaths: 2 }),
      node('t1', 'track', {}),
    ];
    const edges = [edge('weather', 'day', 'A'), edge('day', 't1', 'A')];
    const next = normalizeStackedConditionals(nodes, edges);
    expect(next.nodes.map((item) => item.id).sort()).toEqual(['day', 't1', 'weather']);
  });
});
