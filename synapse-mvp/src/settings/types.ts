export const SETTINGS_TYPE = 'synapse-settings';
export const SETTINGS_SCHEMA_VERSION = 1;
export const SETTINGS_STORAGE_KEY = 'synapse_app_settings';

export type MotionPreference = 'system' | 'reduce' | 'full';
export type WorkspaceStart = 'edit' | 'listen';

export const GRID_SIZE_OPTIONS = [8, 16, 24, 32, 48] as const;

export interface GeneralSettings {
  language: 'en';
  startupWorkspace: WorkspaceStart;
  rememberLastWorkspace: boolean;
  lastWorkspace: WorkspaceStart;
  confirmDestructive: boolean;
  motion: MotionPreference;
}

export interface CanvasSettings {
  showMinimap: boolean;
  snapToGrid: boolean;
  gridSize: number;
  fitViewOnPlaylistSwitch: boolean;
}

export interface NodeSettings {
  defaultVolume: number;
  defaultPlayCount: number;
}

export interface PlaybackSettings {
  masterVolume: number;
}

export interface VisualizerSettings {
  visible: boolean;
  collapseShareStatus: boolean;
}

export interface EnvironmentSettings {
  allowGeolocation: boolean;
}

export interface AppSettings {
  schemaVersion: 1;
  type: typeof SETTINGS_TYPE;
  general: GeneralSettings;
  canvas: CanvasSettings;
  nodes: NodeSettings;
  playback: PlaybackSettings;
  visualizer: VisualizerSettings;
  environment: EnvironmentSettings;
}
