import { describe, expect, it } from 'vitest';
import {
  addCanvasNode,
  canvasPositionAtPointer,
  canvasNodeSize,
  clearCanvasPosition,
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

  it('places a clicked node in a clear spot near the viewport center', () => {
    const stop = registerCanvasPlacement(() => ({ x: 420, y: 310 }));
    const before = usePathStore.getState().nodes;
    expect(addCanvasNode('comment')).toBeNull();
    const added = usePathStore.getState().nodes.at(-1);
    expect(added?.type).toBe('comment');
    expect(added?.position).toEqual(
      clearCanvasPosition({ x: 420, y: 310 }, 'comment', before)
    );
    stop();
  });

  it('centers a dropped node on the pointer', () => {
    expect(addCanvasNode('end', { x: 12, y: 34 })).toBeNull();
    const added = usePathStore.getState().nodes.at(-1);
    expect(added?.type).toBe('end');
    expect(added?.position).toEqual(canvasPositionAtPointer({ x: 12, y: 34 }, 'end'));
  });
});

describe('clearCanvasPosition', () => {
  const center = { x: 400, y: 300 };

  it('keeps the viewport center when the spot is empty', () => {
    expect(clearCanvasPosition(center, 'track', [])).toEqual(
      canvasPositionAtPointer(center, 'track')
    );
  });

  it('shifts right instead of stacking on an existing node', () => {
    const preferred = canvasPositionAtPointer(center, 'track');
    const size = canvasNodeSize('track');
    const next = clearCanvasPosition(center, 'track', [
      { type: 'track', position: preferred },
    ]);
    expect(next).not.toEqual(preferred);
    expect(next.x).toBeGreaterThan(preferred.x);
    expect(next.x).toBeGreaterThanOrEqual(preferred.x + size.width / 4);
  });

  it('places a second clicked node beside the first', () => {
    const stop = registerCanvasPlacement(() => ({ x: 500, y: 400 }));
    expect(addCanvasNode('comment')).toBeNull();
    const first = usePathStore.getState().nodes.at(-1);
    expect(addCanvasNode('comment')).toBeNull();
    const second = usePathStore.getState().nodes.at(-1);
    stop();
    expect(second?.id).not.toBe(first?.id);
    expect(second?.position).not.toEqual(first?.position);
  });
});
