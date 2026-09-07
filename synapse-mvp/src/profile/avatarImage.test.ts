import { describe, expect, it } from 'vitest';
import {
  clampPan,
  cropFromViewport,
  initialAvatarPlan,
  tightenAvatarPlan,
} from './avatarImage';

describe('avatar encode plans', () => {
  it('caps huge images to a starting edge before quality drops', () => {
    const plan = initialAvatarPlan(4000, 3000);
    expect(plan.width).toBe(1600);
    expect(plan.height).toBe(1200);
    expect(plan.quality).toBe(0.9);
  });

  it('keeps already-small dimensions', () => {
    expect(initialAvatarPlan(320, 240)).toEqual({
      width: 320,
      height: 240,
      quality: 0.9,
    });
  });

  it('lowers quality before shrinking pixels', () => {
    const next = tightenAvatarPlan({ width: 800, height: 800, quality: 0.9 });
    expect(next).toEqual({ width: 800, height: 800, quality: 0.78 });
  });

  it('shrinks pixels after quality is already low', () => {
    let plan = { width: 200, height: 100, quality: 0.52 };
    const next = tightenAvatarPlan(plan);
    expect(next).toEqual({ width: 160, height: 80, quality: 0.82 });
  });

  it('stops when the image cannot shrink further', () => {
    expect(
      tightenAvatarPlan({ width: 32, height: 32, quality: 0.52 })
    ).toBeNull();
  });
});

describe('avatar crop viewport', () => {
  it('crops the full square when the image already fills the frame', () => {
    expect(
      cropFromViewport({
        naturalWidth: 200,
        naturalHeight: 200,
        viewport: 100,
        zoom: 1,
        panX: 0,
        panY: 0,
      })
    ).toEqual({ x: 0, y: 0, size: 200 });
  });

  it('takes the centered square from a landscape image', () => {
    expect(
      cropFromViewport({
        naturalWidth: 200,
        naturalHeight: 100,
        viewport: 100,
        zoom: 1,
        panX: 0,
        panY: 0,
      })
    ).toEqual({ x: 50, y: 0, size: 100 });
  });

  it('clamps pan so the image keeps covering the frame', () => {
    expect(clampPan(400, 200, 100)).toBe(50);
    expect(clampPan(-400, 200, 100)).toBe(-50);
  });
});
