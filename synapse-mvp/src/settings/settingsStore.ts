import { create } from 'zustand';
import { scheduleWorkspacePersist } from '../cloud/persistGate';
import { applyMotionPreference } from './motion';
import { defaultSettings, parseSettings, parseSettingsJson, settingsToJson } from './parse';
import { SETTINGS_STORAGE_KEY, type AppSettings } from './types';

interface AppSettingsStore extends AppSettings {
  updateGeneral: (patch: Partial<AppSettings['general']>) => void;
  updateCanvas: (patch: Partial<AppSettings['canvas']>) => void;
  updateNodes: (patch: Partial<AppSettings['nodes']>) => void;
  updatePlayback: (patch: Partial<AppSettings['playback']>) => void;
  updateVisualizer: (patch: Partial<AppSettings['visualizer']>) => void;
  updateEnvironment: (patch: Partial<AppSettings['environment']>) => void;
  importJson: (text: string) => string | null;
  exportJson: () => string;
  reset: () => void;
}

function persist(_settings: AppSettings): void {
  scheduleWorkspacePersist();
}

function load(): AppSettings {
  return defaultSettings();
}

export function readLegacySettings(): AppSettings | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return parseSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function snapshotSettings(): AppSettings {
  return pickSettings(useAppSettings.getState());
}

export function replaceSettings(raw: unknown): void {
  const next = parseSettings(raw);
  applyMotionPreference(next.general.motion);
  useAppSettings.setState(next);
}

function pickSettings(state: AppSettingsStore): AppSettings {
  return {
    schemaVersion: state.schemaVersion,
    type: state.type,
    general: state.general,
    canvas: state.canvas,
    nodes: state.nodes,
    playback: state.playback,
    visualizer: state.visualizer,
    environment: state.environment,
  };
}

function commit(set: (partial: Partial<AppSettingsStore>) => void, next: AppSettings): void {
  persist(next);
  applyMotionPreference(next.general.motion);
  set(next);
}

const initial = load();
if (typeof document !== 'undefined') {
  applyMotionPreference(initial.general.motion);
}

export const useAppSettings = create<AppSettingsStore>((set, get) => ({
  ...initial,

  updateGeneral: (patch) => {
    const current = pickSettings(get());
    commit(set, parseSettings({ ...current, general: { ...current.general, ...patch } }));
  },
  updateCanvas: (patch) => {
    const current = pickSettings(get());
    commit(set, parseSettings({ ...current, canvas: { ...current.canvas, ...patch } }));
  },
  updateNodes: (patch) => {
    const current = pickSettings(get());
    commit(set, parseSettings({ ...current, nodes: { ...current.nodes, ...patch } }));
  },
  updatePlayback: (patch) => {
    const current = pickSettings(get());
    commit(set, parseSettings({ ...current, playback: { ...current.playback, ...patch } }));
  },
  updateVisualizer: (patch) => {
    const current = pickSettings(get());
    commit(set, parseSettings({ ...current, visualizer: { ...current.visualizer, ...patch } }));
  },
  updateEnvironment: (patch) => {
    const current = pickSettings(get());
    commit(set, parseSettings({
      ...current,
      environment: { ...current.environment, ...patch },
    }));
  },
  importJson: (text) => {
    const parsed = parseSettingsJson(text);
    if (!parsed) return 'Import a Synapse settings JSON file.';
    commit(set, parsed);
    return null;
  },
  exportJson: () => settingsToJson(pickSettings(get())),
  reset: () => commit(set, defaultSettings()),
}));

export function getAppSettings(): AppSettings {
  return pickSettings(useAppSettings.getState());
}

export function confirmDestructive(message: string): boolean {
  if (!getAppSettings().general.confirmDestructive) return true;
  return window.confirm(message);
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => applyMotionPreference(getAppSettings().general.motion);
  mq.addEventListener('change', sync);
}
