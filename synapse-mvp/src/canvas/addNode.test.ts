import { describe, expect, it } from 'vitest';
import {
  addCanvasNode,
  canvasPositionAtPointer,
  registerCanvasPlacement,
} from './addNode';
import { usePathStore } from '../store';

describe('addCanvasNode', () => {
  it('refuses a second Start node', () => {
    const start = usePathStore.getState().nodes.find((node) => node.type === 'start');
    if (!start) {
      expect(addCanvasNode('start')).toBeNull();
    }
    expect(addCanvasNode('start')).toBe('There can only be one Start node.');
  });

  it('centers a clicked node on the registered viewport', () => {
    const stop = registerCanvasPlacement(() => ({ x: 420, y: 310 }));
    expect(addCanvasNode('comment')).toBeNull();
    const added = usePathStore.getState().nodes.at(-1);
    expect(added?.type).toBe('comment');
    expect(added?.position).toEqual(canvasPositionAtPointer({ x: 420, y: 310 }, 'comment'));
    stop();
  });

  it('centers a dropped node on the pointer', () => {
    expect(addCanvasNode('end', { x: 12, y: 34 })).toBeNull();
    const added = usePathStore.getState().nodes.at(-1);
    expect(added?.type).toBe('end');
    expect(added?.position).toEqual(canvasPositionAtPointer({ x: 12, y: 34 }, 'end'));
  });
});
