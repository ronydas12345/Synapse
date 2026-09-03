import { describe, expect, it } from 'vitest';
import {
  arrowAngleRad,
  isStartInViewport,
  pickClosestStart,
  startArrowState,
  viewportCenterInGraph,
} from './startArrow';

const viewport = { x: 0, y: 0, zoom: 1 };
const size = { width: 800, height: 600 };

describe('start arrow math', () => {
  it('converts the viewport center into graph coordinates under zoom and pan', () => {
    expect(viewportCenterInGraph({ x: 0, y: 0, zoom: 1 }, size)).toEqual({
      x: 400,
      y: 300,
    });
    expect(viewportCenterInGraph({ x: -200, y: -50, zoom: 2 }, size)).toEqual({
      x: 300,
      y: 175,
    });
  });

  it('hides the arrow when a Start rect intersects the viewport', () => {
    const onScreen = { x: 100, y: 100, width: 128, height: 80 };
    expect(isStartInViewport(onScreen, viewport, size)).toBe(true);
    expect(
      startArrowState(
        [{ id: 'start', rect: onScreen }],
        viewport,
        size
      ).visible
    ).toBe(false);
  });

  it('shows the arrow and points toward an off-screen Start', () => {
    const offRight = { x: 2000, y: 280, width: 128, height: 80 };
    expect(isStartInViewport(offRight, viewport, size)).toBe(false);
    const state = startArrowState(
      [{ id: 'start', rect: offRight }],
      viewport,
      size
    );
    expect(state.visible).toBe(true);
    expect(state.targetId).toBe('start');
    expect(state.angleRad).toBeCloseTo(0, 1);
  });

  it('points left/up using atan2 from viewport center', () => {
    const origin = { x: 400, y: 300 };
    expect(arrowAngleRad(origin, { x: 100, y: 300 })).toBeCloseTo(Math.PI, 5);
    expect(arrowAngleRad(origin, { x: 400, y: 0 })).toBeCloseTo(-Math.PI / 2, 5);
  });

  it('picks the closest off-screen Start and hides if any Start is visible', () => {
    const visible = { x: 10, y: 10, width: 128, height: 80 };
    const far = { x: 5000, y: 5000, width: 128, height: 80 };
    expect(
      startArrowState(
        [
          { id: 'a', rect: visible },
          { id: 'b', rect: far },
        ],
        viewport,
        size
      ).visible
    ).toBe(false);

    const nearOff = { x: 900, y: 280, width: 128, height: 80 };
    const farOff = { x: 4000, y: 280, width: 128, height: 80 };
    const state = startArrowState(
      [
        { id: 'near', rect: nearOff },
        { id: 'far', rect: farOff },
      ],
      viewport,
      size
    );
    expect(state.visible).toBe(true);
    expect(state.targetId).toBe('near');
    expect(
      pickClosestStart(
        [
          { id: 'near', center: { x: 964, y: 320 } },
          { id: 'far', center: { x: 4064, y: 320 } },
        ],
        { x: 400, y: 300 }
      )?.id
    ).toBe('near');
  });
});
