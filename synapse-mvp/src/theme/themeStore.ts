import { create } from 'zustand';
import { scheduleWorkspacePersist } from '../cloud/persistGate';
import { applyTheme } from './applyTheme';
import { mergeThemeCache, readThemeCacheRaw } from './cache';
import { emptyTheme, parseTheme, parseThemeJson, themeToJson } from './parseTheme';
import { BUILTIN_THEMES, DEFAULT_THEME_ID, getBuiltinTheme } from './presets';
import type { SynapseTheme } from './types';
import { parseTagMap, sanitizeTagIds } from '../workshop/tags';

export const THEME_STORAGE_KEY = 'synapse_theme_state';
const STORAGE_KEY = THEME_STORAGE_KEY;

interface PersistedThemeState {
  schemaVersion: 1;
  activeId: string;
  customThemes: SynapseTheme[];
  themeTags: Record<string, string[]>;
}

interface ThemeState {
  activeId: string;
  customThemes: SynapseTheme[];
  themeTags: Record<string, string[]>;
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
  addCustomTheme: (theme: SynapseTheme) => string;
  ingestPublished: (themes: SynapseTheme[]) => void;
  exportActive: () => string | null;
  deleteCustom: (id: string) => void;
  setThemeTags: (id: string, tags: string[]) => void;
}

function persist(activeId: string, customThemes: SynapseTheme[]) {
  mergeThemeCache({
    schemaVersion: 1,
    activeId,
    customThemes,
    themeTags: useThemeStore.getState().themeTags,
  });
  scheduleWorkspacePersist();
}

function load(): Pick<ThemeState, 'activeId' | 'customThemes' | 'themeTags'> {
  const cached = readThemeCacheRaw();
  if (cached) return parseThemeState(cached);
  return { activeId: DEFAULT_THEME_ID, customThemes: [], themeTags: {} };
}

export function parseThemeState(
  raw: unknown
): Pick<ThemeState, 'activeId' | 'customThemes' | 'themeTags'> {
  if (!raw || typeof raw !== 'object') {
    return { activeId: DEFAULT_THEME_ID, customThemes: [], themeTags: {} };
  }
  const parsed = raw as PersistedThemeState;
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
  return {
    activeId,
    customThemes,
    themeTags: parseTagMap('theme', parsed.themeTags),
  };
}

export function readLegacyTheme(): Pick<
  ThemeState,
  'activeId' | 'customThemes' | 'themeTags'
> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseThemeState(JSON.parse(raw));
  } catch {
    return null;
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

export function themeExists(
  id: string,
  customThemes: SynapseTheme[]
): boolean {
  if (!id) return false;
  return Boolean(
    getBuiltinTheme(id) || customThemes.some((t) => t.id === id)
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
  themeTags: initial.themeTags,
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
    const { activeId, customThemes, themeTags } = get();
    const source = resolveTheme(id || activeId, customThemes);
    const draftId = source.builtin ? `custom-${Date.now()}` : source.id;
    const draft: SynapseTheme = {
      ...structuredClone(source),
      builtin: false,
      id: draftId,
      name: source.builtin ? `${source.name} copy` : source.name,
    };
    const copied = source.builtin ? themeTags[source.id] : undefined;
    set({
      draft,
      themeTags:
        copied?.length && !themeTags[draftId]
          ? { ...themeTags, [draftId]: copied }
          : themeTags,
    });
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
    const { activeId, customThemes, draft, themeTags } = get();
    applyTheme(resolveTheme(activeId, customThemes));
    if (
      draft &&
      !getBuiltinTheme(draft.id) &&
      !customThemes.some((theme) => theme.id === draft.id)
    ) {
      const nextTags = { ...themeTags };
      delete nextTags[draft.id];
      persist(activeId, customThemes);
      set({ draft: null, themeTags: nextTags });
      return;
    }
    set({ draft: null });
  },

  duplicateActive: () => {
    const { activeId, customThemes, themeTags } = get();
    const source = resolveTheme(activeId, customThemes);
    const copy = emptyTheme(`custom-${Date.now()}`, `${source.name} copy`);
    copy.colors = { ...source.colors };
    copy.typography = { ...source.typography };
    copy.style = { ...source.style };
    const copied = themeTags[source.id];
    set({
      draft: copy,
      themeTags: copied?.length ? { ...themeTags, [copy.id]: copied } : themeTags,
    });
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

  addCustomTheme: (theme) => {
    const parsed = parseTheme({ ...theme, builtin: false, overlays: [] });
    if (!parsed) return '';
    const { customThemes, activeId } = get();
    let id = parsed.id;
    if (getBuiltinTheme(id) || id.startsWith('standard-') || customThemes.some((t) => t.id === id)) {
      id = `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }
    const stored = { ...parsed, id, builtin: false };
    const next = [...customThemes, stored];
    persist(activeId, next);
    set({ customThemes: next });
    return stored.id;
  },

  ingestPublished: (themes) => {
    const { customThemes, activeId } = get();
    const byId = new Map(customThemes.map((theme) => [theme.id, theme]));
    for (const theme of themes) {
      const parsed = parseTheme({ ...theme, builtin: false, overlays: [] });
      if (!parsed || getBuiltinTheme(parsed.id)) continue;
      byId.set(parsed.id, { ...parsed, builtin: false });
    }
    const next = [...byId.values()];
    persist(activeId, next);
    set({ customThemes: next });
  },

  exportActive: () => {
    const { activeId, customThemes, draft } = get();
    const theme = draft || resolveTheme(activeId, customThemes);
    return themeToJson(theme);
  },

  deleteCustom: (id) => {
    const { customThemes, activeId, draft, themeTags } = get();
    if (draft) return;
    const next = customThemes.filter((t) => t.id !== id);
    const nextActive = activeId === id ? DEFAULT_THEME_ID : activeId;
    const nextTags = { ...themeTags };
    delete nextTags[id];
    applyTheme(resolveTheme(nextActive, next));
    persist(nextActive, next);
    set({ customThemes: next, activeId: nextActive, themeTags: nextTags });
  },

  setThemeTags: (id, tags) => {
    if (!id) return;
    const { activeId, customThemes, themeTags } = get();
    const cleaned = sanitizeTagIds('theme', tags);
    const next = { ...themeTags };
    if (cleaned.length) next[id] = cleaned;
    else delete next[id];
    set({ themeTags: next });
    persist(activeId, customThemes);
  },
}));

export function snapshotThemeState(): PersistedThemeState {
  const { activeId, customThemes, themeTags } = useThemeStore.getState();
  return { schemaVersion: 1, activeId, customThemes, themeTags };
}

export function replaceThemeState(raw: unknown): void {
  const next = parseThemeState(raw);
  mergeThemeCache({
    schemaVersion: 1,
    activeId: next.activeId,
    customThemes: next.customThemes,
    themeTags: next.themeTags,
  });
  applyTheme(resolveTheme(next.activeId, next.customThemes));
  useThemeStore.setState({
    activeId: next.activeId,
    customThemes: next.customThemes,
    themeTags: next.themeTags,
    draft: null,
  });
}

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
