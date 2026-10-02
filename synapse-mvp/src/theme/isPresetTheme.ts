import { normalizeHex } from './color';
import { BUILTIN_THEMES, getBuiltinTheme } from './presets';
import { COLOR_KEYS, type SynapseTheme, type ThemeColors } from './types';

export const PRESET_PUBLISH_ERROR =
  'Default themes cannot be published, including renamed copies. Change the colors so it is no longer a built-in palette.';

export function themeColorFingerprint(
  theme: Pick<SynapseTheme, 'colors'> | { colors: ThemeColors }
): string {
  return COLOR_KEYS.map((key) => normalizeHex(theme.colors[key], '')).join('|');
}

export function matchingBuiltinTheme(
  theme: Pick<SynapseTheme, 'id' | 'builtin' | 'colors'>
): SynapseTheme | undefined {
  if (theme.builtin) {
    return getBuiltinTheme(theme.id) ?? BUILTIN_THEMES[0];
  }
  const byId = getBuiltinTheme(theme.id);
  if (byId) return byId;
  const fingerprint = themeColorFingerprint(theme);
  return BUILTIN_THEMES.find((item) => themeColorFingerprint(item) === fingerprint);
}

export function isBuiltinThemeClone(
  theme: Pick<SynapseTheme, 'id' | 'builtin' | 'colors'>
): boolean {
  return matchingBuiltinTheme(theme) !== undefined;
}

export function builtinThemePublishError(
  theme: Pick<SynapseTheme, 'id' | 'name' | 'builtin' | 'colors'>
): string | null {
  const match = matchingBuiltinTheme(theme);
  if (!match) return null;
  if (theme.id === match.id && theme.builtin) {
    return PRESET_PUBLISH_ERROR;
  }
  if (theme.name.trim().toLowerCase() === match.name.trim().toLowerCase()) {
    return PRESET_PUBLISH_ERROR;
  }
  return `“${theme.name}” matches the default theme ${match.name}. Change the colors before publishing.`;
}

export const BUILTIN_THEME_IDS: string[] = BUILTIN_THEMES.map((theme) => theme.id);
