import { describe, expect, it } from 'vitest';
import {
  ALIGN_PROXIMITY_PX,
  SNAP_THRESHOLD_PX,
  applySnapToDragChanges,
  distanceToBox,
  flowToOverlay,
  hoverGuides,
  nearbyNodeBoxes,
  nodeGuides,
  snapDraggedBox,
} from './alignGuides';

const a = {
  id: 'a',
  x: 0,
  y: 0,
  width: 100,
  height: 40,
};
const b = {
  id: 'b',
  x: 400,
  y: 300,
  width: 80,
  height: 40,
};

describe('align guides', () => {
  it('emits four sides and two center axes', () => {
    const guides = nodeGuides(a);
    expect(guides.filter((g) => g.kind === 'side')).toHaveLength(4);
    expect(guides.filter((g) => g.kind === 'center')).toHaveLength(2);
    expect(guides.find((g) => g.id === 'a-left')?.at).toBe(0);
    expect(guides.find((g) => g.id === 'a-right')?.at).toBe(100);
    expect(guides.find((g) => g.id === 'a-cx')?.at).toBe(50);
    expect(guides.find((g) => g.id === 'a-cy')?.at).toBe(20);
  });

  it('is zero inside the node and grows outside', () => {
    expect(distanceToBox(50, 20, a)).toBe(0);
    expect(distanceToBox(0, 20, a)).toBe(0);
    expect(distanceToBox(150, 20, a)).toBe(50);
  });

  it('only keeps nodes close to the pointer', () => {
    const near = nearbyNodeBoxes({ x: 10, y: 10 }, [a, b], ALIGN_PROXIMITY_PX);
    expect(near.map((n) => n.id)).toEqual(['a']);
    const none = nearbyNodeBoxes({ x: 200, y: 200 }, [a, b], 40);
    expect(none).toEqual([]);
  });

  it('hover shows side lines but not every center line', () => {
    const guides = hoverGuides({ x: 10, y: 10 }, [a, b], 80, SNAP_THRESHOLD_PX);
    expect(guides.filter((g) => g.kind === 'side').length).toBe(4);
    expect(guides.filter((g) => g.kind === 'center')).toEqual([]);
  });

  it('hover shows a center line only when the pointer is on that midline', () => {
    const vertical = hoverGuides({ x: 50, y: 10 }, [a], 80, SNAP_THRESHOLD_PX);
    expect(vertical.some((g) => g.kind === 'center' && g.axis === 'x')).toBe(true);
    expect(vertical.some((g) => g.kind === 'center' && g.axis === 'y')).toBe(false);
    const horizontal = hoverGuides({ x: 10, y: 20 }, [a], 80, SNAP_THRESHOLD_PX);
    expect(horizontal.some((g) => g.kind === 'center' && g.axis === 'y')).toBe(true);
    expect(horizontal.some((g) => g.kind === 'center' && g.axis === 'x')).toBe(false);
  });

  it('maps flow coordinates through the viewport', () => {
    expect(flowToOverlay(10, 20, { x: 5, y: 7, zoom: 2 })).toEqual({ x: 25, y: 47 });
  });
});

describe('alignment snap', () => {
  it('snaps a dragged node to a nearby side', () => {
    const dragged = { id: 'd', x: 102, y: 80, width: 100, height: 40 };
    const snap = snapDraggedBox(dragged, [a], { zoom: 1 });
    expect(snap.dx).toBe(-2);
    expect(snap.guides.some((g) => g.kind === 'side' && g.axis === 'x')).toBe(true);
  });

  it('snaps to a center axis and emits a center guide, not every node center', () => {
    const dragged = { id: 'd', x: 4, y: 80, width: 100, height: 40 };
    const snap = snapDraggedBox(dragged, [a, b], { zoom: 1 });
    expect(snap.dx).toBe(-4);
    const centers = snap.guides.filter((g) => g.kind === 'center');
    expect(centers).toHaveLength(1);
    expect(centers[0]).toMatchObject({ axis: 'x', at: 50 });
    expect(snap.guides.some((g) => g.kind === 'center' && 'at' in g && g.at === 440)).toBe(false);
  });

  it('does not snap when the pointer is far from every edge', () => {
    const dragged = { id: 'd', x: 180, y: 180, width: 40, height: 40 };
    const snap = snapDraggedBox(dragged, [a, b], { zoom: 1, snapPx: 8 });
    expect(snap.dx).toBe(0);
    expect(snap.dy).toBe(0);
    expect(snap.guides).toEqual([]);
  });

  it('snaps a corner onto a 45-degree from another corner', () => {
    const other = { id: 'o', x: 0, y: 0, width: 40, height: 40 };
    const dragged = { id: 'd', x: 90, y: 86, width: 40, height: 40 };
    const snap = snapDraggedBox(dragged, [other], { zoom: 1 });
    expect(snap.guides.some((g) => g.kind === 'diagonal')).toBe(true);
    const moved = { x: dragged.x + snap.dx, y: dragged.y + snap.dy };
    expect(Math.abs(Math.abs(moved.x - 40) - Math.abs(moved.y - 40))).toBeLessThan(0.75);
  });

  it('snaps to repeated spacing and draws dimension lines for the chain', () => {
    const n1 = { id: 'n1', x: 0, y: 0, width: 100, height: 40 };
    const n2 = { id: 'n2', x: 150, y: 0, width: 100, height: 40 };
    const n3 = { id: 'n3', x: 300, y: 0, width: 100, height: 40 };
    const dragged = { id: 'd', x: 448, y: 0, width: 100, height: 40 };
    const snap = snapDraggedBox(dragged, [n1, n2, n3], { zoom: 1 });
    expect(snap.dx).toBe(2);
    const spacing = snap.guides.filter((g) => g.kind === 'spacing');
    expect(spacing.length).toBeGreaterThanOrEqual(3);
    expect(spacing.every((g) => g.kind === 'spacing' && g.gap === 50)).toBe(true);
  });

  it('applies snap to dragging position changes when Shift is held', () => {
    const nodes = [
      { id: 'a', position: { x: 0, y: 0 }, width: 100, height: 40 },
      { id: 'd', position: { x: 102, y: 80 }, width: 100, height: 40 },
    ];
    const result = applySnapToDragChanges(
      [{ type: 'position', id: 'd', dragging: true, position: { x: 102, y: 80 } }],
      nodes,
      {
        shift: true,
        zoom: 1,
        sizeOf: (node) => ({ width: node.width ?? 100, height: node.height ?? 40 }),
        worldOf: (node) => node.position,
      }
    );
    expect(result.changes[0]?.position).toEqual({ x: 100, y: 80 });
    expect(result.dragging).toBe(true);
    expect(result.guides.length).toBeGreaterThan(0);
  });

  it('does not snap without Shift', () => {
    const nodes = [
      { id: 'a', position: { x: 0, y: 0 }, width: 100, height: 40 },
      { id: 'd', position: { x: 102, y: 80 }, width: 100, height: 40 },
    ];
    const result = applySnapToDragChanges(
      [{ type: 'position', id: 'd', dragging: true, position: { x: 102, y: 80 } }],
      nodes,
      {
        shift: false,
        zoom: 1,
        sizeOf: (node) => ({ width: node.width ?? 100, height: node.height ?? 40 }),
        worldOf: (node) => node.position,
      }
    );
    expect(result.changes[0]?.position).toEqual({ x: 102, y: 80 });
    expect(result.guides).toEqual([]);
  });
});
