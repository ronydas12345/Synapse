import { describe, expect, it } from 'vitest';
import { contrastRatio, cssToRgb, lerpRgb, relativeLuminance, rgba } from './color';

describe('theme color helpers', () => {
  it('reads hex and rgb CSS colors', () => {
    expect(cssToRgb('#e28aaa')).toEqual({ r: 226, g: 138, b: 170 });
    expect(cssToRgb('rgb(58, 36, 48)')).toEqual({ r: 58, g: 36, b: 48 });
  });

  it('lerps between accent and warm accent', () => {
    expect(
      lerpRgb({ r: 0, g: 0, b: 0 }, { r: 100, g: 50, b: 0 }, 0.5)
    ).toEqual({ r: 50, g: 25, b: 0 });
  });

  it('formats rgba for canvas fills', () => {
    expect(rgba({ r: 10, g: 20, b: 30 }, 0.5)).toBe('rgba(10, 20, 30, 0.5)');
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(relativeLuminance('#ffffff')).toBe(1);
    expect(relativeLuminance('#000000')).toBe(0);
  });
});
