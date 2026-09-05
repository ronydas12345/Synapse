export const THEME_TYPE = 'synapse-theme' as const;
export const THEME_SCHEMA_VERSION = 1;

export interface ThemeColors {
  workspaceBackground: string;
  workspaceSurface: string;
  panelBackground: string;
  panelElevated: string;
  panelHover: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textFaint: string;
  accent: string;
  accentWarm: string;
  danger: string;
  ok: string;
  warning: string;
  nodeBackground: string;
  nodeBorder: string;
  nodeHeader: string;
  nodeTrack: string;
  nodeConditional: string;
  nodeRandomizer: string;
  nodeTransition: string;
  nodeComment: string;
  nodeStart: string;
  nodeEnd: string;
  edge: string;
  playerBackground: string;
  inputBackground: string;
  gridLine: string;
}

export interface ThemeTypography {
  ui: string;
  display: string;
  mono: string;
  node: string;
}

export interface ThemeStyle {
  radius: number;
  radiusSm: number;
  borderWidth: number;
  gridIntensity: number;
  shadowIntensity: number;
}

export interface SynapseTheme {
  schemaVersion: typeof THEME_SCHEMA_VERSION;
  type: typeof THEME_TYPE;
  id: string;
  name: string;
  version: string;
  builtin?: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  style: ThemeStyle;
  overlays: unknown[];
}

export const COLOR_KEYS: (keyof ThemeColors)[] = [
  'workspaceBackground',
  'workspaceSurface',
  'panelBackground',
  'panelElevated',
  'panelHover',
  'border',
  'borderStrong',
  'textPrimary',
  'textSecondary',
  'textFaint',
  'accent',
  'accentWarm',
  'danger',
  'ok',
  'warning',
  'nodeBackground',
  'nodeBorder',
  'nodeHeader',
  'nodeTrack',
  'nodeConditional',
  'nodeRandomizer',
  'nodeTransition',
  'nodeComment',
  'nodeStart',
  'nodeEnd',
  'edge',
  'playerBackground',
  'inputBackground',
  'gridLine',
];

export const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  workspaceBackground: 'Workspace background',
  workspaceSurface: 'Workspace surface',
  panelBackground: 'Panel background',
  panelElevated: 'Secondary panel',
  panelHover: 'Hover',
  border: 'Border',
  borderStrong: 'Strong border',
  textPrimary: 'Primary text',
  textSecondary: 'Secondary text',
  textFaint: 'Faint text',
  accent: 'Accent',
  accentWarm: 'Warm accent',
  danger: 'Error',
  ok: 'Success',
  warning: 'Warning',
  nodeBackground: 'Node background',
  nodeBorder: 'Node border',
  nodeHeader: 'Node header',
  nodeTrack: 'Track node',
  nodeConditional: 'Conditional node',
  nodeRandomizer: 'Randomizer node',
  nodeTransition: 'Transition node',
  nodeComment: 'Comment node',
  nodeStart: 'Start node',
  nodeEnd: 'End node',
  edge: 'Edge / arrow',
  playerBackground: 'Player background',
  inputBackground: 'Input background',
  gridLine: 'Grid line',
};
