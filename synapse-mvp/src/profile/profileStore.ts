import { extractYouTubeId } from '../playback';
import { create } from 'zustand';
import {
  OPTIONAL_SECTIONS,
  emptyProfile,
  type FavoriteSong,
  type OptionalSectionId,
  type ProfilePlaylist,
  type ProfileVisibility,
  type UserProfile,
} from './types';

const STORAGE_KEY = 'synapse_profile_state';

function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function usernameError(username: string): string | null {
  if (!username) return 'Username is required.';
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return 'Use 3–20 letters, numbers, or underscores.';
  }
  return null;
}

export function displayNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Display name is required.';
  if (trimmed.length > 40) return 'Display name must be 40 characters or fewer.';
  return null;
}

export function reorderSectionOrder(
  order: OptionalSectionId[],
  fromId: OptionalSectionId,
  toId: OptionalSectionId,
  edge: 'before' | 'after' = 'before'
): OptionalSectionId[] {
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0) return order;
  const next = [...order];
  next.splice(from, 1);
  let insert = next.indexOf(toId);
  if (insert < 0) return order;
  if (edge === 'after') insert += 1;
  if (insert === from) return order;
  next.splice(insert, 0, fromId);
  return next;
}

export function daysSince(iso: string): number {
  const start = Date.parse(iso);
  if (!Number.isFinite(start)) return 1;
  const days = Math.floor((Date.now() - start) / 86_400_000) + 1;
  return Math.max(1, days);
}

export function averageListens(profile: UserProfile): number {
  return profile.totalListens / daysSince(profile.createdAt);
}

export function activitySeries(
  listensByDay: Record<string, number>,
  days = 84
): number[] {
  const out: number[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(listensByDay[localDayKey(d)] || 0);
  }
  return out;
}

function sanitizeProfile(raw: unknown): UserProfile {
  const base = emptyProfile();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<UserProfile>;
  const sectionOrder = Array.isArray(p.sectionOrder)
    ? p.sectionOrder.filter((id): id is OptionalSectionId =>
        (OPTIONAL_SECTIONS as readonly string[]).includes(id)
      )
    : [];
  for (const id of OPTIONAL_SECTIONS) {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  }
  const hiddenSections = Array.isArray(p.hiddenSections)
    ? p.hiddenSections.filter((id): id is OptionalSectionId =>
        (OPTIONAL_SECTIONS as readonly string[]).includes(id)
      )
    : [];
  const favoriteSongs = Array.isArray(p.favoriteSongs)
    ? p.favoriteSongs
        .map((song) => ({
          id: String(song?.id || cryptoRandomId()),
          videoId: extractYouTubeId(String(song?.videoId || '')),
          title: String(song?.title || '').slice(0, 80),
          artist: String(song?.artist || '').slice(0, 80),
          album: String(song?.album || '').slice(0, 80),
        }))
        .filter((song) => song.videoId)
        .slice(0, 20)
    : [];
  const playlists = Array.isArray(p.playlists)
    ? p.playlists
        .map((pl) => ({
          id: String(pl?.id || cryptoRandomId()),
          name: String(pl?.name || '').slice(0, 60),
          visibility:
            pl?.visibility === 'public' ? 'public' : ('private' as ProfileVisibility),
        }))
        .filter((pl) => pl.name)
        .slice(0, 30)
    : [];
  const listensByDay =
    p.listensByDay && typeof p.listensByDay === 'object' ? p.listensByDay : {};
  const safeDays: Record<string, number> = {};
  for (const [k, v] of Object.entries(listensByDay)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(Number(v))) {
      safeDays[k] = Math.max(0, Math.floor(Number(v)));
    }
  }
  return {
    schemaVersion: 1,
    username: normalizeUsername(String(p.username || '')),
    displayName: String(p.displayName || '').slice(0, 40),
    visibility: p.visibility === 'public' ? 'public' : 'private',
    avatarDataUrl:
      typeof p.avatarDataUrl === 'string' && p.avatarDataUrl.startsWith('data:image/')
        ? p.avatarDataUrl
        : null,
    location: String(p.location || '').slice(0, 120),
    locationLat:
      p.locationLat != null && Number.isFinite(Number(p.locationLat))
        ? Number(p.locationLat)
        : null,
    locationLon:
      p.locationLon != null && Number.isFinite(Number(p.locationLon))
        ? Number(p.locationLon)
        : null,
    bio: String(p.bio || '').slice(0, 280),
    favoriteGenres: Array.isArray(p.favoriteGenres)
      ? p.favoriteGenres.map((g) => String(g).slice(0, 32)).filter(Boolean).slice(0, 16)
      : [],
    favoriteSongs,
    playlists,
    musicPathVisibility: p.musicPathVisibility === 'public' ? 'public' : 'private',
    sectionOrder,
    hiddenSections,
    createdAt:
      typeof p.createdAt === 'string' && Number.isFinite(Date.parse(p.createdAt))
        ? p.createdAt
        : base.createdAt,
    totalListens: Math.max(0, Math.floor(Number(p.totalListens) || 0)),
    listensByDay: safeDays,
  };
}

function cryptoRandomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function persist(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // quota / private mode
  }
}

function load(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    return sanitizeProfile(JSON.parse(raw));
  } catch {
    return emptyProfile();
  }
}

interface ProfileStore {
  profile: UserProfile;
  patch: (partial: Partial<UserProfile>) => void;
  setUsername: (raw: string) => void;
  setDisplayName: (name: string) => void;
  setVisibility: (visibility: ProfileVisibility) => void;
  setAvatarDataUrl: (url: string | null) => void;
  addGenre: (genre: string) => void;
  removeGenre: (genre: string) => void;
  addSong: (input: {
    videoId: string;
    title?: string;
    artist?: string;
    album?: string;
  }) => void;
  removeSong: (id: string) => void;
  addPlaylist: (name: string, visibility: ProfileVisibility) => void;
  removePlaylist: (id: string) => void;
  setPlaylistVisibility: (id: string, visibility: ProfileVisibility) => void;
  hideSection: (id: OptionalSectionId) => void;
  showSection: (id: OptionalSectionId) => void;
  moveSection: (id: OptionalSectionId, direction: -1 | 1) => void;
  reorderSections: (
    fromId: OptionalSectionId,
    toId: OptionalSectionId,
    edge?: 'before' | 'after'
  ) => void;
  recordListen: () => void;
}

function commit(profile: UserProfile): UserProfile {
  persist(profile);
  return profile;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: load(),
  patch: (partial) =>
    set((state) => ({ profile: commit({ ...state.profile, ...partial }) })),
  setUsername: (raw) =>
    set((state) => ({
      profile: commit({ ...state.profile, username: normalizeUsername(raw) }),
    })),
  setDisplayName: (name) =>
    set((state) => ({
      profile: commit({ ...state.profile, displayName: name.slice(0, 40) }),
    })),
  setVisibility: (visibility) =>
    set((state) => ({ profile: commit({ ...state.profile, visibility }) })),
  setAvatarDataUrl: (url) =>
    set((state) => ({ profile: commit({ ...state.profile, avatarDataUrl: url }) })),
  addGenre: (genre) =>
    set((state) => {
      const next = genre.trim().slice(0, 32);
      if (!next) return state;
      if (state.profile.favoriteGenres.includes(next)) return state;
      return {
        profile: commit({
          ...state.profile,
          favoriteGenres: [...state.profile.favoriteGenres, next].slice(0, 16),
        }),
      };
    }),
  removeGenre: (genre) =>
    set((state) => ({
      profile: commit({
        ...state.profile,
        favoriteGenres: state.profile.favoriteGenres.filter((g) => g !== genre),
      }),
    })),
  addSong: (input) =>
    set((state) => {
      const videoId = extractYouTubeId(input.videoId);
      if (!videoId) return state;
      if (state.profile.favoriteSongs.some((s) => s.videoId === videoId)) {
        return state;
      }
      const song: FavoriteSong = {
        id: cryptoRandomId(),
        videoId,
        title: (input.title || '').trim().slice(0, 80),
        artist: (input.artist || '').trim().slice(0, 80),
        album: (input.album || '').trim().slice(0, 80),
      };
      return {
        profile: commit({
          ...state.profile,
          favoriteSongs: [...state.profile.favoriteSongs, song].slice(0, 20),
        }),
      };
    }),
  removeSong: (id) =>
    set((state) => ({
      profile: commit({
        ...state.profile,
        favoriteSongs: state.profile.favoriteSongs.filter((s) => s.id !== id),
      }),
    })),
  addPlaylist: (name, visibility) =>
    set((state) => {
      const pl: ProfilePlaylist = {
        id: cryptoRandomId(),
        name: name.trim().slice(0, 60),
        visibility,
      };
      if (!pl.name) return state;
      return {
        profile: commit({
          ...state.profile,
          playlists: [...state.profile.playlists, pl].slice(0, 30),
        }),
      };
    }),
  removePlaylist: (id) =>
    set((state) => ({
      profile: commit({
        ...state.profile,
        playlists: state.profile.playlists.filter((p) => p.id !== id),
      }),
    })),
  setPlaylistVisibility: (id, visibility) =>
    set((state) => ({
      profile: commit({
        ...state.profile,
        playlists: state.profile.playlists.map((p) =>
          p.id === id ? { ...p, visibility } : p
        ),
      }),
    })),
  hideSection: (id) =>
    set((state) => {
      if (state.profile.hiddenSections.includes(id)) return state;
      return {
        profile: commit({
          ...state.profile,
          hiddenSections: [...state.profile.hiddenSections, id],
        }),
      };
    }),
  showSection: (id) =>
    set((state) => ({
      profile: commit({
        ...state.profile,
        hiddenSections: state.profile.hiddenSections.filter((s) => s !== id),
      }),
    })),
  moveSection: (id, direction) =>
    set((state) => {
      const order = [...state.profile.sectionOrder];
      const i = order.indexOf(id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= order.length) return state;
      [order[i], order[j]] = [order[j], order[i]];
      return { profile: commit({ ...state.profile, sectionOrder: order }) };
    }),
  reorderSections: (fromId, toId, edge = 'before') =>
    set((state) => {
      const order = reorderSectionOrder(
        state.profile.sectionOrder,
        fromId,
        toId,
        edge
      );
      if (order === state.profile.sectionOrder) return state;
      return { profile: commit({ ...state.profile, sectionOrder: order }) };
    }),
  recordListen: () => {
    const day = localDayKey();
    const profile = get().profile;
    const next = {
      ...profile,
      totalListens: profile.totalListens + 1,
      listensByDay: {
        ...profile.listensByDay,
        [day]: (profile.listensByDay[day] || 0) + 1,
      },
    };
    persist(next);
    set({ profile: next });
  },
}));

export { localDayKey };
