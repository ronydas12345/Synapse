import { DEFAULT_THEME_ID } from '../theme/presets';
import {
  DEFAULT_STYLE_DELAY_MS,
  DEFAULT_STYLE_DURATION_MS,
  MAX_STYLE_DELAY_MS,
  MAX_STYLE_DURATION_MS,
  STYLE_EASINGS,
  STYLE_LAYER_IDS,
  type StyleEasing,
  type StyleLayerId,
  type StyleNodeData,
} from './types';

export {
  DEFAULT_STYLE_DELAY_MS,
  DEFAULT_STYLE_DURATION_MS,
  MAX_STYLE_DELAY_MS,
  MAX_STYLE_DURATION_MS,
  STYLE_EASINGS,
  STYLE_LAYER_IDS,
} from './types';
export type { StyleEasing, StyleLayerId, StyleNodeData } from './types';

export const STYLE_LAYER_LABELS: Record<StyleLayerId, string> = {
  workspace: 'Workspace',
  text: 'Text & accents',
  nodes: 'Nodes & edges',
  player: 'Player',
  typography: 'Fonts',
  chrome: 'Radius, grid, shadow',
};

export const STYLE_EASING_OPTIONS: { id: StyleEasing; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'ease', label: 'Ease' },
  { id: 'easeInOut', label: 'Ease in-out' },
];

function clampStyleMs(raw: unknown, fallback: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(0, Math.round(n)));
}

function formatStyleSeconds(ms: number): string {
  const seconds = ms / 1000;
  const digits = ms % 1000 === 0 ? 0 : 1;
  return `${seconds.toFixed(digits)}s`;
}

export function defaultStyleNodeData(): StyleNodeData {
  return {
    themeId: DEFAULT_THEME_ID,
    layers: [...STYLE_LAYER_IDS],
    durationMs: DEFAULT_STYLE_DURATION_MS,
    delayMs: DEFAULT_STYLE_DELAY_MS,
    easing: 'easeInOut',
  };
}

export function formatStyleNodeTiming(data: StyleNodeData): string {
  const delay =
    data.delayMs > 0 ? `${formatStyleSeconds(data.delayMs)} delay` : '';
  const duration = data.durationMs <= 0 ? 'Snap' : formatStyleSeconds(data.durationMs);
  const easing = data.easing === 'easeInOut' ? 'ease in-out' : data.easing;
  return [delay, duration, easing].filter(Boolean).join(' · ');
}

export function normalizeStyleLayers(raw: unknown): StyleLayerId[] {
  if (!Array.isArray(raw)) return [...STYLE_LAYER_IDS];
  const allowed = new Set<string>(STYLE_LAYER_IDS);
  const seen = new Set<StyleLayerId>();
  const next: StyleLayerId[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !allowed.has(item)) continue;
    const id = item as StyleLayerId;
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next.length > 0 ? next : [...STYLE_LAYER_IDS];
}

export function styleThemeDisplayName(
  themeId: string,
  themes: { id: string; name: string }[]
): string {
  if (!themeId) return 'Pick a saved theme';
  return themes.find((t) => t.id === themeId)?.name || themeId;
}

export function parseStyleNodeData(raw: unknown): StyleNodeData {
  const rec =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const themeId = typeof rec.themeId === 'string' ? rec.themeId : '';
  const durationMs = clampStyleMs(
    rec.durationMs,
    DEFAULT_STYLE_DURATION_MS,
    MAX_STYLE_DURATION_MS
  );
  const delayMs = clampStyleMs(rec.delayMs, DEFAULT_STYLE_DELAY_MS, MAX_STYLE_DELAY_MS);
  const easing = STYLE_EASINGS.includes(rec.easing as StyleEasing)
    ? (rec.easing as StyleEasing)
    : 'easeInOut';
  return {
    themeId,
    layers: normalizeStyleLayers(rec.layers),
    durationMs,
    delayMs,
    easing,
  };
}
