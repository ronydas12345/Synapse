import { create } from 'zustand';
import { applyTheme } from './applyTheme';
import { emptyTheme, parseTheme, parseThemeJson, themeToJson } from './parseTheme';
import { BUILTIN_THEMES, DEFAULT_THEME_ID, getBuiltinTheme } from './presets';
import type { SynapseTheme } from './types';

const STORAGE_KEY = 'synapse_theme_state';

interface PersistedThemeState {
  schemaVersion: 1;
  activeId: string;
  customThemes: SynapseTheme[];
}

interface ThemeState {
  activeId: string;
  customThemes: SynapseTheme[];
  draft: SynapseTheme | null;
  setActiveId: (id: string) => void;
  startEdit: (id?: string) => void;
  updateDraft: (patch: {
    name?: string;
    colors?: Partial<SynapseTheme['colors']>;
    typography?: Partial<SynapseTheme['typography']>;
    style?: Partial<SynapseTheme['style']>;
  }) => void;
  saveDraft: () => void;
  cancelEdit: () => void;
  duplicateActive: () => void;
  resetDraft: () => void;
  importJson: (text: string) => string | null;
  exportActive: () => string | null;
  deleteCustom: (id: string) => void;
}

function persist(activeId: string, customThemes: SynapseTheme[]) {
  const payload: PersistedThemeState = {
    schemaVersion: 1,
    activeId,
    customThemes,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

function load(): Pick<ThemeState, 'activeId' | 'customThemes'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activeId: DEFAULT_THEME_ID, customThemes: [] };
    const parsed = JSON.parse(raw) as PersistedThemeState;
    const customThemes = Array.isArray(parsed.customThemes)
      ? parsed.customThemes
          .map((t) => parseTheme(t))
          .filter((t): t is SynapseTheme => t != null)
      : [];
    const activeId =
      typeof parsed.activeId === 'string' &&
      (getBuiltinTheme(parsed.activeId) || customThemes.some((t) => t.id === parsed.activeId))
        ? parsed.activeId
        : DEFAULT_THEME_ID;
    return { activeId, customThemes };
  } catch {
    return { activeId: DEFAULT_THEME_ID, customThemes: [] };
  }
}

export function resolveTheme(
  activeId: string,
  customThemes: SynapseTheme[]
): SynapseTheme {
  return (
    customThemes.find((t) => t.id === activeId) ||
    getBuiltinTheme(activeId) ||
    getBuiltinTheme(DEFAULT_THEME_ID)!
  );
}

export function allThemes(customThemes: SynapseTheme[]): SynapseTheme[] {
  return [...BUILTIN_THEMES, ...customThemes];
}

const initial = load();

if (typeof document !== 'undefined') {
  applyTheme(resolveTheme(initial.activeId, initial.customThemes));
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeId: initial.activeId,
  customThemes: initial.customThemes,
  draft: null,

  setActiveId: (id) => {
    const { customThemes, draft } = get();
    if (draft) return;
    const theme = resolveTheme(id, customThemes);
    applyTheme(theme);
    persist(theme.id, customThemes);
    set({ activeId: theme.id });
  },

  startEdit: (id) => {
    const { activeId, customThemes } = get();
    const source = resolveTheme(id || activeId, customThemes);
    const draft: SynapseTheme = {
      ...structuredClone(source),
      builtin: false,
      id: source.builtin ? `custom-${Date.now()}` : source.id,
      name: source.builtin ? `${source.name} copy` : source.name,
    };
    set({ draft });
  },

  updateDraft: (patch) => {
    set((state) => {
      if (!state.draft) return state;
      const draft = state.draft;
      return {
        draft: {
          ...draft,
          name: patch.name ?? draft.name,
          colors: patch.colors ? { ...draft.colors, ...patch.colors } : draft.colors,
          typography: patch.typography
            ? { ...draft.typography, ...patch.typography }
            : draft.typography,
          style: patch.style ? { ...draft.style, ...patch.style } : draft.style,
        },
      };
    });
  },

  saveDraft: () => {
    const { draft, customThemes } = get();
    if (!draft) return;
    const saved = parseTheme({ ...draft, builtin: false, overlays: [] });
    if (!saved) return;
    const nextCustom = customThemes.some((t) => t.id === saved.id)
      ? customThemes.map((t) => (t.id === saved.id ? saved : t))
      : [...customThemes, saved];
    applyTheme(saved);
    persist(saved.id, nextCustom);
    set({ customThemes: nextCustom, activeId: saved.id, draft: null });
  },

  cancelEdit: () => {
    const { activeId, customThemes } = get();
    applyTheme(resolveTheme(activeId, customThemes));
    set({ draft: null });
  },

  duplicateActive: () => {
    const { activeId, customThemes } = get();
    const source = resolveTheme(activeId, customThemes);
    const copy = emptyTheme(`custom-${Date.now()}`, `${source.name} copy`);
    copy.colors = { ...source.colors };
    copy.typography = { ...source.typography };
    copy.style = { ...source.style };
    set({ draft: copy });
  },

  resetDraft: () => {
    const { draft, customThemes, activeId } = get();
    if (!draft) return;
    const builtin = getBuiltinTheme(activeId);
    const saved = customThemes.find((t) => t.id === draft.id);
    const source = saved || builtin || resolveTheme(activeId, customThemes);
    set({
      draft: {
        ...structuredClone(source),
        id: draft.id,
        name: draft.name,
        builtin: false,
      },
    });
  },

  importJson: (text) => {
    const theme = parseThemeJson(text);
    if (!theme) return 'Invalid theme file.';
    if (getBuiltinTheme(theme.id) || theme.id.startsWith('standard-')) {
      theme.id = `custom-${Date.now()}`;
    }
    const { customThemes } = get();
    if (customThemes.some((t) => t.id === theme.id)) {
      theme.id = `custom-${Date.now()}`;
    }
    const next = [...customThemes, theme];
    applyTheme(theme);
    persist(theme.id, next);
    set({ customThemes: next, activeId: theme.id, draft: null });
    return null;
  },

  exportActive: () => {
    const { activeId, customThemes, draft } = get();
    const theme = draft || resolveTheme(activeId, customThemes);
    return themeToJson(theme);
  },

  deleteCustom: (id) => {
    const { customThemes, activeId, draft } = get();
    if (draft) return;
    const next = customThemes.filter((t) => t.id !== id);
    const nextActive = activeId === id ? DEFAULT_THEME_ID : activeId;
    applyTheme(resolveTheme(nextActive, next));
    persist(nextActive, next);
    set({ customThemes: next, activeId: nextActive });
  },
}));

export function filterThemes(
  themes: SynapseTheme[],
  query: string
): SynapseTheme[] {
  const q = query.trim().toLowerCase();
  if (!q) return themes;
  return themes.filter(
    (t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
  );
}
