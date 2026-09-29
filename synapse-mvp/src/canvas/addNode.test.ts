import { describe, expect, it } from 'vitest';
import { addCanvasNode } from './addNode';
import { usePathStore } from '../store';

describe('addCanvasNode', () => {
  it('refuses a second Start node', () => {
    const start = usePathStore.getState().nodes.find((node) => node.type === 'start');
    if (!start) {
      expect(addCanvasNode('start')).toBeNull();
    }
    expect(addCanvasNode('start')).toBe('There can only be one Start node.');
  });
});
