import { describe, expect, it } from 'vitest';
import { parseTheme, parseThemeJson, themeToJson } from './parseTheme';
import { BUILTIN_THEMES } from './presets';
import { themeCssVars } from './applyTheme';
import { filterThemes } from './themeStore';

describe('theme schema', () => {
  it('round-trips a builtin theme through JSON', () => {
    const source = BUILTIN_THEMES[0];
    const parsed = parseThemeJson(themeToJson(source));
    expect(parsed?.id).toBe(source.id);
    expect(parsed?.type).toBe('synapse-theme');
    expect(parsed?.colors.accent).toBe(source.colors.accent);
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

  it('maps theme tokens to CSS variables', () => {
    const vars = themeCssVars(BUILTIN_THEMES[0]);
    expect(vars['--accent']).toBe(BUILTIN_THEMES[0].colors.accent);
    expect(vars['--bg-void']).toBe(BUILTIN_THEMES[0].colors.workspaceBackground);
    expect(vars['--font-ui']).toContain('Outfit');
  });

  it('filters the preset list by name', () => {
    const hits = filterThemes(BUILTIN_THEMES, 'solar');
    expect(hits.map((t) => t.id).sort()).toEqual([
      'solarized-dark',
      'solarized-light',
    ]);
  });

  it('ships about 25 builtin presets', () => {
    expect(BUILTIN_THEMES).toHaveLength(25);
    expect(new Set(BUILTIN_THEMES.map((t) => t.id)).size).toBe(25);
  });
});
