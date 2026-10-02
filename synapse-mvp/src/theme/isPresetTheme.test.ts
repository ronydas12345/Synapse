import { describe, expect, it } from 'vitest';
import {
  builtinThemePublishError,
  isBuiltinThemeClone,
  matchingBuiltinTheme,
  themeColorFingerprint,
} from './isPresetTheme';
import { emptyTheme } from './parseTheme';
import { BUILTIN_THEMES } from './presets';

describe('isBuiltinThemeClone', () => {
  it('treats every built-in theme as a preset', () => {
    for (const theme of BUILTIN_THEMES) {
      expect(isBuiltinThemeClone(theme)).toBe(true);
    }
  });

  it('blocks a renamed copy that keeps the same colors', () => {
    const ocean = BUILTIN_THEMES.find((theme) => theme.id === 'ocean-blue');
    expect(ocean).toBeTruthy();
    const copy = {
      ...ocean!,
      id: 'custom-123',
      name: 'Sea breeze',
      builtin: false,
    };
    expect(isBuiltinThemeClone(copy)).toBe(true);
    expect(matchingBuiltinTheme(copy)?.id).toBe('ocean-blue');
    expect(builtinThemePublishError(copy)).toMatch(/Ocean Blue/);
  });

  it('allows a custom theme whose colors differ from every preset', () => {
    const original = emptyTheme('custom-mine', 'My original');
    original.colors = {
      ...original.colors,
      workspaceBackground: '#112233',
      accent: '#ff00aa',
      nodeStart: '#00ffcc',
    };
    expect(isBuiltinThemeClone(original)).toBe(false);
    expect(builtinThemePublishError(original)).toBeNull();
  });

  it('gives each built-in theme a unique color fingerprint', () => {
    const prints = BUILTIN_THEMES.map(themeColorFingerprint);
    expect(new Set(prints).size).toBe(BUILTIN_THEMES.length);
  });
});
