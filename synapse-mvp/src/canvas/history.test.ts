import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  canRedo,
  canUndo,
  historyDepth,
  recordEdit,
  redo,
  resetHistory,
  undo,
} from './history';

function node(id: string, x = 0): Node {
  return { id, type: 'track', position: { x, y: 0 }, data: { label: id } };
}

function edge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

describe('editor history', () => {
  it('undoes and redoes graph edits', () => {
    const start = [node('start')];
    resetHistory(start, []);
    recordEdit([node('start'), node('a', 40)], []);
    recordEdit([node('start'), node('a', 40)], [edge('e1', 'start', 'a')]);
    expect(canUndo()).toBe(true);
    expect(historyDepth().past).toBe(2);

    const afterUndo = undo();
    expect(afterUndo?.edges).toEqual([]);
    expect(afterUndo?.nodes.map((n) => n.id)).toEqual(['start', 'a']);
    expect(canRedo()).toBe(true);

    const afterRedo = redo();
    expect(afterRedo?.edges.map((e) => e.id)).toEqual(['e1']);
  });

  it('clears redo after a new edit', () => {
    resetHistory([node('start')], []);
    recordEdit([node('start'), node('a')], []);
    undo();
    recordEdit([node('start'), node('b')], []);
    expect(canRedo()).toBe(false);
    expect(undo()?.nodes.map((n) => n.id)).toEqual(['start']);
  });

  it('coalesces rapid edits with the same key', () => {
    resetHistory([node('a')], []);
    recordEdit([node('a', 1)], [], { coalesceKey: 'a:volume' });
    recordEdit([node('a', 2)], [], { coalesceKey: 'a:volume' });
    recordEdit([node('a', 3)], [], { coalesceKey: 'a:volume' });
    expect(historyDepth().past).toBe(1);
    expect(undo()?.nodes[0].position.x).toBe(0);
  });

  it('ignores identical snapshots', () => {
    const nodes = [node('start')];
    resetHistory(nodes, []);
    recordEdit(nodes, []);
    expect(canUndo()).toBe(false);
  });
});
