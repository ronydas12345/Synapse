import { describe, expect, it } from 'vitest';
import { emptyTheme } from '../theme/parseTheme';
import { parseStyleNodeData, defaultStyleNodeData, formatStyleNodeTiming } from './parse';
import { easeT, lerpTheme, mergeStyleLayers } from './merge';

describe('style node parse', () => {
  it('defaults to all layers and a bounded duration', () => {
    const fallback = defaultStyleNodeData();
    expect(parseStyleNodeData({})).toEqual({
      themeId: '',
      layers: fallback.layers,
      durationMs: fallback.durationMs,
      delayMs: 0,
      easing: 'easeInOut',
    });
    expect(parseStyleNodeData({ durationMs: 99999 }).durationMs).toBe(5000);
    expect(parseStyleNodeData({ durationMs: -4 }).durationMs).toBe(0);
    expect(parseStyleNodeData({ delayMs: 999999 }).delayMs).toBe(60000);
    expect(parseStyleNodeData({ delayMs: -8 }).delayMs).toBe(0);
    expect(parseStyleNodeData({ easing: 'nope' }).easing).toBe('easeInOut');
  });

  it('formats delay and duration for the node body', () => {
    const layers = defaultStyleNodeData().layers;
    expect(
      formatStyleNodeTiming({
        themeId: 'x',
        layers,
        durationMs: 600,
        delayMs: 0,
        easing: 'easeInOut',
      })
    ).toBe('0.6s · ease in-out');
    expect(
      formatStyleNodeTiming({
        themeId: 'x',
        layers,
        durationMs: 0,
        delayMs: 2400,
        easing: 'linear',
      })
    ).toBe('2.4s delay · Snap · linear');
  });

  it('keeps known layers and treats an empty list as all', () => {
    expect(parseStyleNodeData({ layers: ['text', 'nope', 'text'] }).layers).toEqual([
      'text',
    ]);
    expect(parseStyleNodeData({ layers: [] }).layers).toEqual(
      defaultStyleNodeData().layers
    );
  });
});

describe('style layer merge and lerp', () => {
  it('copies only selected layers onto the base theme', () => {
    const base = emptyTheme('base', 'Base');
    const target = emptyTheme('cherry-tree', 'Cherry Tree');
    target.colors.accent = '#ff88aa';
    target.colors.workspaceBackground = '#fff1f6';
    target.typography.ui = 'Georgia';
    const merged = mergeStyleLayers(base, target, ['text']);
    expect(merged.colors.accent).toBe('#ff88aa');
    expect(merged.colors.workspaceBackground).toBe(base.colors.workspaceBackground);
    expect(merged.typography.ui).toBe(base.typography.ui);
    expect(merged.name).toBe('Cherry Tree');
  });

  it('copies visualizer bars with the player or chrome layer', () => {
    const base = emptyTheme('base', 'Base');
    const target = emptyTheme('to', 'To');
    target.style.visualizerBarCount = 48;
    expect(mergeStyleLayers(base, target, ['player']).style.visualizerBarCount).toBe(48);
    expect(mergeStyleLayers(base, target, ['chrome']).style.visualizerBarCount).toBe(48);
    expect(mergeStyleLayers(base, target, ['text']).style.visualizerBarCount).toBe(28);
  });

  it('interpolates colors and snaps typography halfway', () => {
    const from = emptyTheme('from', 'From');
    const to = emptyTheme('to', 'To');
    from.colors.accent = '#000000';
    to.colors.accent = '#ffffff';
    from.typography.ui = 'Outfit';
    to.typography.ui = 'Georgia';
    expect(lerpTheme(from, to, 0).colors.accent).toBe('#000000');
    expect(lerpTheme(from, to, 1).colors.accent).toBe('#ffffff');
    expect(lerpTheme(from, to, 0.49).typography.ui).toBe('Outfit');
    expect(lerpTheme(from, to, 0.5).typography.ui).toBe('Georgia');
    from.style.edgeType = 'bezier';
    to.style.edgeType = 'triangular';
    expect(lerpTheme(from, to, 0.49).style.edgeType).toBe('bezier');
    expect(lerpTheme(from, to, 0.5).style.edgeType).toBe('triangular');
    from.style.visualizerBarCount = 12;
    to.style.visualizerBarCount = 48;
    expect(lerpTheme(from, to, 0.2).style.visualizerBarCount).toBe(16);
    expect(lerpTheme(from, to, 1).style.visualizerBarCount).toBe(48);
  });

  it('eases in a 0–1 range', () => {
    expect(easeT(0, 'linear')).toBe(0);
    expect(easeT(1, 'easeInOut')).toBe(1);
    expect(easeT(0.5, 'linear')).toBe(0.5);
    expect(easeT(0.5, 'ease')).toBe(0.5);
  });
});
