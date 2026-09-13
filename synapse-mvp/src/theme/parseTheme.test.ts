import { describe, expect, it } from 'vitest';
import { parseTheme, parseThemeJson, themeToJson } from './parseTheme';
import { BUILTIN_THEMES } from './presets';
import { logoUsesContrastInk, themeCssVars } from './applyTheme';
import { filterThemes } from './themeStore';

describe('theme schema', () => {
  it('round-trips a builtin theme through JSON', () => {
    const source = BUILTIN_THEMES[0];
    const parsed = parseThemeJson(themeToJson(source));
    expect(parsed?.id).toBe(source.id);
    expect(parsed?.type).toBe('synapse-theme');
    expect(parsed?.colors.accent).toBe(source.colors.accent);
    expect(parsed?.style.edgeType).toBe(source.style.edgeType);
    expect(parsed?.builtin).toBe(false);
  });

  it('rejects non-theme JSON and injected fonts', () => {
    expect(parseTheme({ type: 'not-a-theme', schemaVersion: 1, id: 'x' })).toBeNull();
    expect(parseThemeJson('{')).toBeNull();
    const parsed = parseTheme({
      schemaVersion: 1,
      type: 'synapse-theme',
      id: 'ok-theme',
      name: '<script>xss</script>Ocean',
      colors: { accent: 'red', workspaceBackground: '#112233' },
      typography: { ui: 'url(javascript:alert(1))' },
    });
    expect(parsed?.name).toBe('scriptxss/scriptOcean');
    expect(parsed?.typography.ui).toBe('Outfit');
    expect(parsed?.colors.accent).toBe('#3ecfbf');
    expect(parsed?.colors.workspaceBackground).toBe('#112233');
  });

  it('gives pretty pink a softer display face', () => {
    const pink = BUILTIN_THEMES.find((t) => t.id === 'pretty-pink');
    expect(pink?.typography.display).toBe('Fraunces');
    expect(pink?.typography.ui).toBe('Space Grotesk');
  });

  it('maps theme tokens to CSS variables', () => {
    const vars = themeCssVars(BUILTIN_THEMES[0]);
    expect(vars['--accent']).toBe(BUILTIN_THEMES[0].colors.accent);
    expect(vars['--node-style']).toBe(BUILTIN_THEMES[0].colors.nodeStyle);
    expect(vars['--bg-void']).toBe(BUILTIN_THEMES[0].colors.workspaceBackground);
    expect(vars['--brand-ink']).toBe('#ffffff');
    expect(vars['--font-ui']).toContain('Outfit');
  });

  it('uses black Synapse lettering on light themes', () => {
    const light = BUILTIN_THEMES.find((t) => t.id === 'standard-light');
    expect(light).toBeTruthy();
    expect(themeCssVars(light!)['--brand-ink']).toBe('#000000');
    expect(themeCssVars(light!)['--logo-ink']).toBe('#000000');
  });

  it('keeps the purple-blue mark on typical themes and inks it on high contrast', () => {
    expect(logoUsesContrastInk(BUILTIN_THEMES[0])).toBe(false);
    const light = BUILTIN_THEMES.find((t) => t.id === 'standard-light')!;
    expect(logoUsesContrastInk(light)).toBe(false);
    const hcLight = BUILTIN_THEMES.find((t) => t.id === 'high-contrast-light')!;
    const hcDark = BUILTIN_THEMES.find((t) => t.id === 'high-contrast-dark')!;
    expect(logoUsesContrastInk(hcLight)).toBe(true);
    expect(logoUsesContrastInk(hcDark)).toBe(true);
  });

  it('rejects unknown arrow types on import', () => {
    const parsed = parseTheme({
      schemaVersion: 1,
      type: 'synapse-theme',
      id: 'ok-theme',
      name: 'Edges',
      style: { edgeType: 'javascript:alert(1)' },
    });
    expect(parsed?.style.edgeType).toBe('bezier');
  });

  it('snaps imported visualizer bar counts onto the allowlist', () => {
    const parsed = parseTheme({
      schemaVersion: 1,
      type: 'synapse-theme',
      id: 'ok-theme',
      name: 'Bars',
      style: { visualizerBarCount: 30 },
    });
    expect(parsed?.style.visualizerBarCount).toBe(28);
  });

  it('maps cyberpunk to triangular arrows', () => {
    const cyber = BUILTIN_THEMES.find((t) => t.id === 'cyberpunk');
    expect(cyber?.style.edgeType).toBe('triangular');
    expect(themeCssVars(cyber!)['--edge-type']).toBe('triangular');
    expect(cyber?.style.visualizerBarCount).toBe(48);
    expect(themeCssVars(cyber!)['--visualizer-bars']).toBe('48');
  });

  it('filters the preset list by name', () => {
    const hits = filterThemes(BUILTIN_THEMES, 'solar');
    expect(hits.map((t) => t.id).sort()).toEqual([
      'solarized-dark',
      'solarized-light',
    ]);
  });

  it('ships cherry tree as the light pretty-pink pair', () => {
    expect(BUILTIN_THEMES.some((t) => t.id === 'cherry-tree')).toBe(true);
    expect(BUILTIN_THEMES).toHaveLength(26);
    expect(new Set(BUILTIN_THEMES.map((t) => t.id)).size).toBe(26);
  });
});
