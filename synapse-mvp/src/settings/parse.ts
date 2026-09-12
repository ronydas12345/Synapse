import {
  GRID_SIZE_OPTIONS,
  SETTINGS_SCHEMA_VERSION,
  SETTINGS_TYPE,
  type AppSettings,
  type CanvasSettings,
  type EnvironmentSettings,
  type GeneralSettings,
  type MotionPreference,
  type NodeSettings,
  type PlaybackSettings,
  type VisualizerSettings,
  type WorkspaceStart,
} from './types';

export function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function defaultSettings(): AppSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    type: SETTINGS_TYPE,
    general: {
      language: 'en',
      startupWorkspace: 'edit',
      rememberLastWorkspace: true,
      lastWorkspace: 'edit',
      confirmDestructive: true,
      motion: 'system',
    },
    canvas: {
      showMinimap: true,
      snapToGrid: false,
      gridSize: 24,
      fitViewOnPlaylistSwitch: true,
    },
    nodes: {
      defaultVolume: 100,
      defaultPlayCount: 1,
    },
    playback: {
      masterVolume: 100,
    },
    visualizer: {
      visible: true,
      collapseShareStatus: false,
    },
    environment: {
      allowGeolocation: true,
    },
  };
}

function pickWorkspace(value: unknown, fallback: WorkspaceStart): WorkspaceStart {
  return value === 'listen' || value === 'edit' ? value : fallback;
}

function pickMotion(value: unknown, fallback: MotionPreference): MotionPreference {
  return value === 'reduce' || value === 'full' || value === 'system' ? value : fallback;
}

function nearestOption(value: unknown, options: readonly number[], fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return options.reduce((best, opt) =>
    Math.abs(opt - n) < Math.abs(best - n) ? opt : best
  );
}

export function scaleVolume(nodeVolume: unknown, masterVolume: unknown): number {
  const node = clampInt(nodeVolume, 0, 100, 100);
  const master = clampInt(masterVolume, 0, 100, 100);
  return clampInt((node * master) / 100, 0, 100, node);
}

export function workspaceStartRoute(settings: AppSettings): WorkspaceStart {
  if (settings.general.rememberLastWorkspace) return settings.general.lastWorkspace;
  return settings.general.startupWorkspace;
}

function parseGeneral(raw: unknown, fallback: GeneralSettings): GeneralSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    language: 'en',
    startupWorkspace: pickWorkspace(src.startupWorkspace, fallback.startupWorkspace),
    rememberLastWorkspace: src.rememberLastWorkspace == null
      ? fallback.rememberLastWorkspace
      : Boolean(src.rememberLastWorkspace),
    lastWorkspace: pickWorkspace(src.lastWorkspace, fallback.lastWorkspace),
    confirmDestructive: src.confirmDestructive == null
      ? fallback.confirmDestructive
      : Boolean(src.confirmDestructive),
    motion: pickMotion(src.motion, fallback.motion),
  };
}

function parseCanvas(raw: unknown, fallback: CanvasSettings): CanvasSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    showMinimap: src.showMinimap == null ? fallback.showMinimap : Boolean(src.showMinimap),
    snapToGrid: src.snapToGrid == null ? fallback.snapToGrid : Boolean(src.snapToGrid),
    gridSize: nearestOption(src.gridSize, GRID_SIZE_OPTIONS, fallback.gridSize),
    fitViewOnPlaylistSwitch:
      src.fitViewOnPlaylistSwitch == null
        ? fallback.fitViewOnPlaylistSwitch
        : Boolean(src.fitViewOnPlaylistSwitch),
  };
}

function parseNodes(raw: unknown, fallback: NodeSettings): NodeSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    defaultVolume: clampInt(src.defaultVolume, 0, 100, fallback.defaultVolume),
    defaultPlayCount: clampInt(src.defaultPlayCount, 1, 99, fallback.defaultPlayCount),
  };
}

function parsePlayback(raw: unknown, fallback: PlaybackSettings): PlaybackSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    masterVolume: clampInt(src.masterVolume, 0, 100, fallback.masterVolume),
  };
}

function parseVisualizer(raw: unknown, fallback: VisualizerSettings): VisualizerSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    visible: src.visible == null ? fallback.visible : Boolean(src.visible),
    collapseShareStatus:
      src.collapseShareStatus == null
        ? fallback.collapseShareStatus
        : Boolean(src.collapseShareStatus),
  };
}

function parseEnvironment(raw: unknown, fallback: EnvironmentSettings): EnvironmentSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    allowGeolocation:
      src.allowGeolocation == null ? fallback.allowGeolocation : Boolean(src.allowGeolocation),
  };
}

export function parseSettings(input: unknown): AppSettings {
  const base = defaultSettings();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;
  if (raw.type != null && raw.type !== SETTINGS_TYPE) return base;
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    type: SETTINGS_TYPE,
    general: parseGeneral(raw.general, base.general),
    canvas: parseCanvas(raw.canvas, base.canvas),
    nodes: parseNodes(raw.nodes, base.nodes),
    playback: parsePlayback(raw.playback, base.playback),
    visualizer: parseVisualizer(raw.visualizer, base.visualizer),
    environment: parseEnvironment(raw.environment, base.environment),
  };
}

export function parseSettingsJson(text: string): AppSettings | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const type = (parsed as { type?: unknown }).type;
    if (type != null && type !== SETTINGS_TYPE) return null;
    return parseSettings(parsed);
  } catch {
    return null;
  }
}

export function settingsToJson(settings: AppSettings): string {
  return JSON.stringify(
    {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      type: SETTINGS_TYPE,
      general: settings.general,
      canvas: settings.canvas,
      nodes: settings.nodes,
      playback: settings.playback,
      visualizer: settings.visualizer,
      environment: settings.environment,
    },
    null,
    2
  );
}
