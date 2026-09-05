import { COLOR_KEYS, THEME_SCHEMA_VERSION, THEME_TYPE, type SynapseTheme } from './types';
import { normalizeHex } from './color';
import { sanitizeFont } from './fonts';

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function sanitizeName(value: unknown): string {
  const text = typeof value === 'string' ? value : '';
  return text.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 64) || 'Untitled theme';
}

const FALLBACK_COLORS: SynapseTheme['colors'] = {
  workspaceBackground: '#07080b',
  workspaceSurface: '#0c0e14',
  panelBackground: '#11141c',
  panelElevated: '#171b26',
  panelHover: '#1e2433',
  border: '#2a3142',
  borderStrong: '#3a4254',
  textPrimary: '#e9ecf4',
  textSecondary: '#8b93a7',
  textFaint: '#5c657a',
  accent: '#3ecfbf',
  accentWarm: '#e8a45c',
  danger: '#f07178',
  ok: '#7dcea0',
  warning: '#e8a45c',
  nodeBackground: '#161b27',
  nodeBorder: '#3a4254',
  nodeHeader: '#1a2030',
  nodeTrack: '#8b93a7',
  nodeConditional: '#3ecfbf',
  nodeRandomizer: '#78a0ff',
  nodeTransition: '#e8a45c',
  nodeComment: '#8b93a7',
  nodeStart: '#7dcea0',
  nodeEnd: '#f07178',
  edge: '#8b93a7',
  playerBackground: '#0a0c12',
  inputBackground: '#0c0e14',
  gridLine: '#1c2230',
};

export function emptyTheme(id: string, name: string): SynapseTheme {
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    type: THEME_TYPE,
    id,
    name,
    version: '1.0.0',
    colors: { ...FALLBACK_COLORS },
    typography: {
      ui: 'Outfit',
      display: 'Syne',
      mono: 'IBM Plex Mono',
      node: 'Outfit',
    },
    style: {
      radius: 10,
      radiusSm: 6,
      borderWidth: 1,
      gridIntensity: 0.04,
      shadowIntensity: 0.35,
    },
    overlays: [],
  };
}

export function parseTheme(input: unknown): SynapseTheme | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (raw.type !== THEME_TYPE) return null;
  const schemaVersion = Number(raw.schemaVersion);
  if (schemaVersion !== THEME_SCHEMA_VERSION) return null;
  if (typeof raw.id !== 'string' || !ID.test(raw.id)) return null;

  const base = emptyTheme(raw.id, sanitizeName(raw.name));
  const colorsRaw =
    raw.colors && typeof raw.colors === 'object'
      ? (raw.colors as Record<string, unknown>)
      : {};
  const colors = { ...base.colors };
  for (const key of COLOR_KEYS) {
    colors[key] = normalizeHex(colorsRaw[key], base.colors[key]);
  }

  const typographyRaw =
    raw.typography && typeof raw.typography === 'object'
      ? (raw.typography as Record<string, unknown>)
      : {};
  const styleRaw =
    raw.style && typeof raw.style === 'object'
      ? (raw.style as Record<string, unknown>)
      : {};

  return {
    ...base,
    name: sanitizeName(raw.name),
    version: typeof raw.version === 'string' ? raw.version.slice(0, 16) : '1.0.0',
    builtin: false,
    colors,
    typography: {
      ui: sanitizeFont(typographyRaw.ui, base.typography.ui),
      display: sanitizeFont(typographyRaw.display, base.typography.display),
      mono: sanitizeFont(typographyRaw.mono, base.typography.mono),
      node: sanitizeFont(typographyRaw.node, base.typography.node),
    },
    style: {
      radius: clamp(styleRaw.radius, 0, 24, base.style.radius),
      radiusSm: clamp(styleRaw.radiusSm, 0, 16, base.style.radiusSm),
      borderWidth: clamp(styleRaw.borderWidth, 1, 4, base.style.borderWidth),
      gridIntensity: clamp(styleRaw.gridIntensity, 0.01, 0.2, base.style.gridIntensity),
      shadowIntensity: clamp(styleRaw.shadowIntensity, 0, 0.8, base.style.shadowIntensity),
    },
    overlays: [],
  };
}

export function parseThemeJson(text: string): SynapseTheme | null {
  try {
    return parseTheme(JSON.parse(text));
  } catch {
    return null;
  }
}

export function themeToJson(theme: SynapseTheme): string {
  const { builtin: _builtin, ...rest } = theme;
  return JSON.stringify({ ...rest, overlays: [] }, null, 2);
}
