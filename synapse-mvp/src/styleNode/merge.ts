import { hexToRgb, lerpRgb, rgbToHex } from '../theme/color';
import { COLOR_KEYS, type SynapseTheme, type ThemeColors } from '../theme/types';
import { sanitizeVisualizerBarCount } from '../theme/visualizerBars';
import { STYLE_LAYER_IDS, type StyleEasing, type StyleLayerId } from './types';
import { normalizeStyleLayers } from './parse';

const LAYER_COLOR_KEYS: Record<
  Exclude<StyleLayerId, 'typography' | 'chrome'>,
  (keyof ThemeColors)[]
> = {
  workspace: [
    'workspaceBackground',
    'workspaceSurface',
    'panelBackground',
    'panelElevated',
    'panelHover',
    'border',
    'borderStrong',
    'gridLine',
  ],
  text: [
    'textPrimary',
    'textSecondary',
    'textFaint',
    'accent',
    'accentWarm',
    'danger',
    'ok',
    'warning',
  ],
  nodes: [
    'nodeBackground',
    'nodeBorder',
    'nodeHeader',
    'nodeTrack',
    'nodeConditional',
    'nodeRandomizer',
    'nodeTransition',
    'nodeStyle',
    'nodeComment',
    'nodeStart',
    'nodeEnd',
    'edge',
  ],
  player: ['playerBackground', 'inputBackground'],
};

export function cloneTheme(theme: SynapseTheme): SynapseTheme {
  return {
    ...theme,
    colors: { ...theme.colors },
    typography: { ...theme.typography },
    style: { ...theme.style },
    overlays: [...theme.overlays],
  };
}

export function easeT(t: number, easing: StyleEasing): number {
  const x = Math.min(1, Math.max(0, t));
  if (easing === 'linear') return x;
  if (easing === 'ease') return x * x * (3 - 2 * x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function mergeStyleLayers(
  base: SynapseTheme,
  target: SynapseTheme,
  layers: readonly StyleLayerId[]
): SynapseTheme {
  const set = new Set(normalizeStyleLayers(layers));
  const next = cloneTheme(base);
  next.id = target.id;
  next.name = target.name;
  for (const layer of STYLE_LAYER_IDS) {
    if (!set.has(layer)) continue;
    if (layer === 'typography') {
      next.typography = { ...target.typography };
      continue;
    }
    if (layer === 'chrome') {
      next.style = { ...target.style };
      continue;
    }
    if (layer === 'player') {
      next.style.visualizerBarCount = target.style.visualizerBarCount;
    }
    for (const key of LAYER_COLOR_KEYS[layer]) {
      next.colors[key] = target.colors[key];
    }
  }
  return next;
}

function lerpNum(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function lerpTheme(
  from: SynapseTheme,
  to: SynapseTheme,
  t: number
): SynapseTheme {
  const u = Math.min(1, Math.max(0, t));
  const colors = { ...from.colors };
  for (const key of COLOR_KEYS) {
    colors[key] = rgbToHex(
      lerpRgb(hexToRgb(from.colors[key]), hexToRgb(to.colors[key]), u)
    );
  }
  const snap = u >= 0.5;
  return {
    ...to,
    colors,
    typography: snap ? { ...to.typography } : { ...from.typography },
    style: {
      ...from.style,
      radius: lerpNum(from.style.radius, to.style.radius, u),
      radiusSm: lerpNum(from.style.radiusSm, to.style.radiusSm, u),
      borderWidth: lerpNum(from.style.borderWidth, to.style.borderWidth, u),
      gridIntensity: lerpNum(from.style.gridIntensity, to.style.gridIntensity, u),
      shadowIntensity: lerpNum(
        from.style.shadowIntensity,
        to.style.shadowIntensity,
        u
      ),
      edgeType: snap ? to.style.edgeType : from.style.edgeType,
      visualizerBarCount: sanitizeVisualizerBarCount(
        lerpNum(
          from.style.visualizerBarCount,
          to.style.visualizerBarCount,
          u
        )
      ),
    },
    overlays: snap ? [...to.overlays] : [...from.overlays],
  };
}
