export const STYLE_LAYER_IDS = [
  'workspace',
  'text',
  'nodes',
  'player',
  'typography',
  'chrome',
] as const;

export type StyleLayerId = (typeof STYLE_LAYER_IDS)[number];

export const STYLE_EASINGS = ['linear', 'ease', 'easeInOut'] as const;
export type StyleEasing = (typeof STYLE_EASINGS)[number];

export const DEFAULT_STYLE_DURATION_MS = 600;
export const MAX_STYLE_DURATION_MS = 5000;
export const DEFAULT_STYLE_DELAY_MS = 0;
export const MAX_STYLE_DELAY_MS = 60000;

export interface StyleNodeData {
  themeId: string;
  layers: StyleLayerId[];
  durationMs: number;
  delayMs: number;
  easing: StyleEasing;
}
