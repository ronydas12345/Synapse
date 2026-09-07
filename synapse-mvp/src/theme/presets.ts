import { emptyTheme } from './parseTheme';
import { luminance } from './color';
import type { SynapseTheme, ThemeColors, ThemeTypography } from './types';

type Palette = Partial<ThemeColors> &
  Pick<
    ThemeColors,
    | 'workspaceBackground'
    | 'workspaceSurface'
    | 'panelBackground'
    | 'textPrimary'
    | 'accent'
  >;

function preset(id: string, name: string, palette: Palette): SynapseTheme {
  const base = emptyTheme(id, name);
  const colors: ThemeColors = { ...base.colors, ...palette };
  if (!palette.panelElevated) colors.panelElevated = palette.panelBackground;
  if (!palette.playerBackground) colors.playerBackground = palette.workspaceSurface;
  if (!palette.inputBackground) colors.inputBackground = palette.workspaceSurface;
  if (!palette.nodeBackground) colors.nodeBackground = palette.panelBackground;
  if (!palette.nodeHeader) colors.nodeHeader = palette.panelBackground;
  if (!palette.accentWarm) colors.accentWarm = palette.accent;
  if (!palette.edge) colors.edge = palette.accent;
  if (!palette.nodeConditional) colors.nodeConditional = palette.accent;
  const light = luminance(colors.workspaceBackground) > 0.55;
  if (!palette.panelHover) {
    colors.panelHover = colors.workspaceSurface;
  }
  if (light && !palette.border) {
    colors.border = '#c5ccd8';
    colors.borderStrong = palette.borderStrong || '#9aa3b5';
  }
  if (light && !palette.nodeBorder) {
    colors.nodeBorder = colors.borderStrong;
  }
  if (light && !palette.nodeTrack) {
    colors.nodeTrack = colors.textSecondary;
  }
  if (light && !palette.textFaint && palette.textSecondary) {
    colors.textFaint = palette.textSecondary;
  }
  return {
    ...base,
    builtin: true,
    colors,
  };
}

const STANDARD: ThemeTypography = {
  ui: 'Outfit',
  display: 'Syne',
  mono: 'IBM Plex Mono',
  node: 'Outfit',
};

const PRESET_TYPE: Record<string, Partial<ThemeTypography>> = {
  'standard-dark': STANDARD,
  'standard-light': STANDARD,
  'high-contrast-light': {
    ui: 'system-ui',
    display: 'Outfit',
    mono: 'ui-monospace',
    node: 'Segoe UI',
  },
  'high-contrast-dark': {
    ui: 'system-ui',
    display: 'Outfit',
    mono: 'ui-monospace',
    node: 'Segoe UI',
  },
  'ocean-blue': { ui: 'Inter', display: 'Syne', node: 'Inter' },
  'bold-blue': { ui: 'Space Grotesk', display: 'Syne', node: 'Outfit' },
  'leaf-green': { display: 'Georgia' },
  'pretty-pink': {
    ui: 'Space Grotesk',
    display: 'Fraunces',
    node: 'Inter',
  },
  'cherry-tree': {
    ui: 'Space Grotesk',
    display: 'Fraunces',
    node: 'Inter',
  },
  'blood-red': { ui: 'Inter', display: 'Syne', mono: 'JetBrains Mono', node: 'Inter' },
  'sunset-orange': { display: 'Fraunces' },
  'purple-night': { ui: 'Space Grotesk', display: 'Fraunces', node: 'Inter' },
  'lavender': { ui: 'Space Grotesk', display: 'Fraunces', node: 'Inter' },
  'forest': { display: 'Georgia' },
  'deep-ocean': { ui: 'Inter', display: 'Syne', node: 'Inter' },
  'midnight': { ui: 'Inter', node: 'Inter' },
  cyberpunk: {
    ui: 'Space Grotesk',
    display: 'Syne',
    mono: 'JetBrains Mono',
    node: 'Inter',
  },
  synthwave: {
    ui: 'Space Grotesk',
    display: 'Fraunces',
    mono: 'JetBrains Mono',
    node: 'Inter',
  },
  monochrome: {
    ui: 'Inter',
    display: 'Outfit',
    mono: 'ui-monospace',
    node: 'Inter',
  },
  'warm-cream': { display: 'Georgia', ui: 'Outfit' },
  'solarized-light': { ui: 'Inter', display: 'Georgia', node: 'Inter' },
  'solarized-dark': { ui: 'Inter', display: 'Georgia', node: 'Inter' },
  rose: { ui: 'Space Grotesk', display: 'Fraunces', node: 'Inter' },
  mint: { ui: 'Outfit', display: 'Syne' },
  amber: { display: 'Fraunces' },
  neon: {
    ui: 'Space Grotesk',
    display: 'Syne',
    mono: 'JetBrains Mono',
    node: 'Inter',
  },
};

function withTypeVibe(theme: SynapseTheme): SynapseTheme {
  return {
    ...theme,
    typography: { ...theme.typography, ...PRESET_TYPE[theme.id] },
  };
}

export const BUILTIN_THEMES: SynapseTheme[] = [
  preset('standard-dark', 'Standard Dark', {
    workspaceBackground: '#07080b',
    workspaceSurface: '#0c0e14',
    panelBackground: '#11141c',
    panelElevated: '#171b26',
    panelHover: '#1e2433',
    border: '#3a4254',
    borderStrong: '#4a5368',
    textPrimary: '#e9ecf4',
    textSecondary: '#8b93a7',
    textFaint: '#5c657a',
    accent: '#3ecfbf',
    accentWarm: '#e8a45c',
    danger: '#f07178',
    ok: '#7dcea0',
    nodeTrack: '#8b93a7',
    nodeRandomizer: '#78a0ff',
    nodeTransition: '#e8a45c',
    nodeStart: '#7dcea0',
    nodeEnd: '#f07178',
    gridLine: '#9aa3b8',
  }),
  preset('standard-light', 'Standard Light', {
    workspaceBackground: '#eef1f6',
    workspaceSurface: '#f7f8fb',
    panelBackground: '#ffffff',
    panelElevated: '#f3f5f9',
    panelHover: '#e8ecf3',
    border: '#c5ccd8',
    borderStrong: '#9aa3b5',
    textPrimary: '#1b2230',
    textSecondary: '#5b6578',
    textFaint: '#7d8698',
    accent: '#0f9d8e',
    accentWarm: '#c47a28',
    danger: '#c4454d',
    ok: '#2d8a5b',
    nodeBackground: '#ffffff',
    gridLine: '#3a4254',
  }),
  preset('high-contrast-light', 'High Contrast Light', {
    workspaceBackground: '#ffffff',
    workspaceSurface: '#ffffff',
    panelBackground: '#ffffff',
    panelElevated: '#f0f0f0',
    panelHover: '#e6e6e6',
    border: '#000000',
    borderStrong: '#000000',
    textPrimary: '#000000',
    textSecondary: '#111111',
    textFaint: '#333333',
    accent: '#0050c8',
    danger: '#9b0000',
    ok: '#006400',
    gridLine: '#000000',
  }),
  preset('high-contrast-dark', 'High Contrast Dark', {
    workspaceBackground: '#000000',
    workspaceSurface: '#000000',
    panelBackground: '#0a0a0a',
    panelElevated: '#161616',
    panelHover: '#222222',
    border: '#ffffff',
    borderStrong: '#ffffff',
    textPrimary: '#ffffff',
    textSecondary: '#eeeeee',
    textFaint: '#cccccc',
    accent: '#5cffcf',
    danger: '#ff6b6b',
    ok: '#7dff9a',
    gridLine: '#ffffff',
  }),
  preset('ocean-blue', 'Ocean Blue', {
    workspaceBackground: '#041821',
    workspaceSurface: '#07212c',
    panelBackground: '#0b2c3a',
    panelElevated: '#123848',
    textPrimary: '#e8f6fb',
    textSecondary: '#8db8c8',
    accent: '#3ec6e8',
    ok: '#5fd0b0',
    nodeRandomizer: '#7fd4f0',
  }),
  preset('bold-blue', 'Bold Blue', {
    workspaceBackground: '#07101f',
    workspaceSurface: '#0b1730',
    panelBackground: '#122247',
    textPrimary: '#eef3ff',
    accent: '#4d7cff',
    accentWarm: '#7aa2ff',
  }),
  preset('leaf-green', 'Leaf Green', {
    workspaceBackground: '#0a140c',
    workspaceSurface: '#102016',
    panelBackground: '#173222',
    textPrimary: '#eaf6ec',
    accent: '#5dce7a',
    ok: '#7dcea0',
  }),
  preset('pretty-pink', 'Pretty Pink', {
    workspaceBackground: '#1a0d14',
    workspaceSurface: '#24141d',
    panelBackground: '#331c29',
    textPrimary: '#fdeef5',
    accent: '#f08ab8',
    accentWarm: '#ffb3c9',
  }),
  preset('cherry-tree', 'Cherry Tree', {
    workspaceBackground: '#f7eef2',
    workspaceSurface: '#fdf6f8',
    panelBackground: '#fffafc',
    panelElevated: '#f3e4ea',
    panelHover: '#ead5de',
    border: '#e3c5d0',
    borderStrong: '#d0a3b4',
    textPrimary: '#3a2430',
    textSecondary: '#7a5566',
    textFaint: '#9a7584',
    accent: '#e28aaa',
    accentWarm: '#efb4c6',
    danger: '#c45c6e',
    ok: '#6a9e78',
    nodeBackground: '#fffafc',
    nodeHeader: '#f8edf1',
    nodeRandomizer: '#d48bb0',
    nodeConditional: '#e28aaa',
    nodeComment: '#c9a0b0',
    gridLine: '#3a2430',
  }),
  preset('blood-red', 'Blood Red', {
    workspaceBackground: '#140708',
    workspaceSurface: '#1d0c0e',
    panelBackground: '#2a1215',
    textPrimary: '#fdecee',
    accent: '#e24b57',
    danger: '#ff6b73',
  }),
  preset('sunset-orange', 'Sunset Orange', {
    workspaceBackground: '#160e08',
    workspaceSurface: '#22140c',
    panelBackground: '#332016',
    textPrimary: '#fff4ea',
    accent: '#f08a3c',
    accentWarm: '#ffb060',
  }),
  preset('purple-night', 'Purple Night', {
    workspaceBackground: '#100817',
    workspaceSurface: '#180c24',
    panelBackground: '#241536',
    textPrimary: '#f4ecff',
    accent: '#b57aff',
  }),
  preset('lavender', 'Lavender', {
    workspaceBackground: '#16121d',
    workspaceSurface: '#1e1928',
    panelBackground: '#2a2438',
    textPrimary: '#f3eefc',
    accent: '#c5a7f2',
  }),
  preset('forest', 'Forest', {
    workspaceBackground: '#08110c',
    workspaceSurface: '#0d1a12',
    panelBackground: '#15261b',
    textPrimary: '#e8f5ea',
    accent: '#6fbf7a',
    nodeStart: '#8fd99a',
  }),
  preset('deep-ocean', 'Deep Ocean', {
    workspaceBackground: '#030b14',
    workspaceSurface: '#061525',
    panelBackground: '#0b2238',
    textPrimary: '#dcefff',
    accent: '#2aa0d4',
  }),
  preset('midnight', 'Midnight', {
    workspaceBackground: '#05060a',
    workspaceSurface: '#090b12',
    panelBackground: '#10131c',
    textPrimary: '#d7dbe6',
    accent: '#6ea8ff',
  }),
  preset('cyberpunk', 'Cyberpunk', {
    workspaceBackground: '#0a0610',
    workspaceSurface: '#12091c',
    panelBackground: '#1c0f2c',
    textPrimary: '#f6e8ff',
    accent: '#ff2bd6',
    accentWarm: '#00f0ff',
    nodeRandomizer: '#00f0ff',
  }),
  preset('synthwave', 'Synthwave', {
    workspaceBackground: '#12061a',
    workspaceSurface: '#1b0a28',
    panelBackground: '#2a1040',
    textPrimary: '#ffe9fb',
    accent: '#ff6ad5',
    accentWarm: '#7af0ff',
  }),
  preset('monochrome', 'Monochrome', {
    workspaceBackground: '#111111',
    workspaceSurface: '#171717',
    panelBackground: '#1f1f1f',
    panelElevated: '#2a2a2a',
    textPrimary: '#f2f2f2',
    textSecondary: '#b0b0b0',
    accent: '#d0d0d0',
    danger: '#ffffff',
    ok: '#c8c8c8',
  }),
  preset('warm-cream', 'Warm Cream', {
    workspaceBackground: '#f3ead9',
    workspaceSurface: '#faf3e6',
    panelBackground: '#fffaf0',
    panelElevated: '#f4ead8',
    border: '#d9cbb0',
    textPrimary: '#3b2d1c',
    textSecondary: '#6d5b43',
    accent: '#b86b2b',
    danger: '#a33b32',
    ok: '#4d7a45',
    gridLine: '#3b2d1c',
  }),
  preset('solarized-light', 'Solarized Light', {
    workspaceBackground: '#fdf6e3',
    workspaceSurface: '#eee8d5',
    panelBackground: '#fdf6e3',
    textPrimary: '#657b83',
    textSecondary: '#93a1a1',
    accent: '#268bd2',
    danger: '#dc322f',
    ok: '#859900',
    gridLine: '#586e75',
  }),
  preset('solarized-dark', 'Solarized Dark', {
    workspaceBackground: '#002b36',
    workspaceSurface: '#073642',
    panelBackground: '#073642',
    textPrimary: '#eee8d5',
    textSecondary: '#93a1a1',
    accent: '#2aa198',
    danger: '#dc322f',
    ok: '#859900',
  }),
  preset('rose', 'Rose', {
    workspaceBackground: '#1a1012',
    workspaceSurface: '#251518',
    panelBackground: '#341c22',
    textPrimary: '#fdecef',
    accent: '#e07090',
  }),
  preset('mint', 'Mint', {
    workspaceBackground: '#0b1614',
    workspaceSurface: '#12211e',
    panelBackground: '#1a2e2a',
    textPrimary: '#e8fbf5',
    accent: '#6ee7b7',
  }),
  preset('amber', 'Amber', {
    workspaceBackground: '#140f06',
    workspaceSurface: '#1d1609',
    panelBackground: '#2a210f',
    textPrimary: '#fff6e0',
    accent: '#f5b942',
  }),
  preset('neon', 'Neon', {
    workspaceBackground: '#05050a',
    workspaceSurface: '#0a0a14',
    panelBackground: '#12122a',
    textPrimary: '#f4f7ff',
    accent: '#39ff14',
    accentWarm: '#ff00ea',
    nodeRandomizer: '#00e5ff',
  }),
].map(withTypeVibe);

export const DEFAULT_THEME_ID = 'standard-dark';

export function getBuiltinTheme(id: string): SynapseTheme | undefined {
  return BUILTIN_THEMES.find((t) => t.id === id);
}

export function listBuiltinThemes(): SynapseTheme[] {
  return BUILTIN_THEMES;
}
