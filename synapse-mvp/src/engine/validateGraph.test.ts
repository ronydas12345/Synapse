import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { validateGraph, validationSummary } from './validateGraph';

function n(id: string, type: string, extra: Partial<Node> = {}): Node {
  return { id, type, position: { x: 0, y: 0 }, data: {}, ...extra };
}

function e(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}

describe('validateGraph', () => {
  it('reports a missing Start as an error', () => {
    const issues = validateGraph([n('t', 'track')], []);
    expect(issues.some((issue) => issue.id === 'missing-start')).toBe(true);
    expect(validationSummary(issues).errors).toBeGreaterThan(0);
  });

  it('ignores comments for reachability', () => {
    const issues = validateGraph(
      [n('start', 'start'), n('note', 'comment', { data: { text: 'hi' } })],
      []
    );
    expect(issues.some((issue) => issue.nodeId === 'note')).toBe(false);
  });

  it('warns about an unreachable track', () => {
    const issues = validateGraph(
      [n('start', 'start'), n('t', 'track', { data: { videoId: 'abc' } })],
      []
    );
    expect(issues.some((issue) => issue.id === 'unreachable-t')).toBe(true);
  });

  it('does not warn when the track is connected from Start', () => {
    const issues = validateGraph(
      [n('start', 'start'), n('t', 'track', { data: { videoId: 'abc' } })],
      [e('start', 't')]
    );
    expect(issues.some((issue) => issue.id === 'unreachable-t')).toBe(false);
    expect(issues.some((issue) => issue.severity === 'error')).toBe(false);
  });

  it('flags dangling edges and empty randomizers', () => {
    const issues = validateGraph(
      [n('start', 'start'), n('r', 'randomizer')],
      [{ id: 'gone', source: 'start', target: 'missing' }]
    );
    expect(issues.some((issue) => issue.id.startsWith('dangling-'))).toBe(true);
    expect(issues.some((issue) => issue.id === 'randomizer-empty-r')).toBe(true);
  });
});
