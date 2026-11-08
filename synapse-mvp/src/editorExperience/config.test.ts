import { describe, expect, it } from 'vitest';
import { experienceConfig, resolveOpenViewport } from './config';

describe('editor experience config', () => {
  it('never restricts capabilities across modes', () => {
    for (const mode of ['basic', 'intermediate', 'advanced'] as const) {
      const config = experienceConfig(mode);
      expect(config.mode).toBe(mode);
      expect(config.label.length).toBeGreaterThan(0);
      expect(config.readableOpenZoom).toBeGreaterThan(0);
    }
    expect(experienceConfig('basic').leftDragPans).toBe(true);
    expect(experienceConfig('intermediate').leftDragPans).toBe(false);
    expect(experienceConfig('advanced').firstUseTips).toBe(false);
    expect(experienceConfig('basic').firstUseTips).toBe(true);
  });

  it('restores a saved viewport before fitting', () => {
    expect(
      resolveOpenViewport({
        saved: { x: 12, y: 24, zoom: 0.7 },
        start: { x: 0, y: 0, width: 160, height: 72 },
        config: experienceConfig('advanced'),
        fitOnSwitch: true,
      })
    ).toEqual({ type: 'restore', x: 12, y: 24, zoom: 0.7 });
  });

  it('centers Start at a readable zoom in Basic when nothing is saved', () => {
    expect(
      resolveOpenViewport({
        saved: null,
        start: { x: 100, y: 40, width: 160, height: 72 },
        config: experienceConfig('basic'),
        fitOnSwitch: true,
      })
    ).toEqual({ type: 'start', x: 180, y: 76, zoom: 1 });
  });

  it('fits only when Advanced has no saved view and fit-on-switch is on', () => {
    expect(
      resolveOpenViewport({
        saved: null,
        start: { x: 0, y: 0, width: 160, height: 72 },
        config: experienceConfig('advanced'),
        fitOnSwitch: true,
      })
    ).toEqual({ type: 'fit' });
    expect(
      resolveOpenViewport({
        saved: null,
        start: { x: 0, y: 0, width: 160, height: 72 },
        config: experienceConfig('advanced'),
        fitOnSwitch: false,
      })
    ).toEqual({ type: 'keep' });
  });
});
