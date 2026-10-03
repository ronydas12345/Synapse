import { firstFilled } from '../auth/identity';
import {
  asProfileVisibility,
  emptyProfile,
  type UserProfile,
} from '../profile/types';

export type ServerProfileFields = {
  visibility?: unknown;
  bio?: unknown;
  extras?: unknown;
};

function asCloudProfile(value: unknown): Partial<UserProfile> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Partial<UserProfile>;
}

function hasExtras(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value as object).length > 0;
}

function asList<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function asCoord(value: unknown, fallback: number | null): number | null {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function profileExtrasPayload(profile: UserProfile): Record<string, unknown> {
  return {
    location: profile.location,
    locationLat: profile.locationLat,
    locationLon: profile.locationLon,
    bio: profile.bio,
    favoriteGenres: profile.favoriteGenres,
    favoriteSongs: profile.favoriteSongs,
    playlists: profile.playlists,
    musicPathVisibility: profile.musicPathVisibility,
    sectionOrder: profile.sectionOrder,
    hiddenSections: profile.hiddenSections,
    createdAt: profile.createdAt,
    totalListens: profile.totalListens,
    listensByDay: profile.listensByDay,
  };
}

export function mergeWorkspaceProfile(
  cloud: unknown,
  identity: Pick<UserProfile, 'username' | 'displayName'> | undefined,
  current: UserProfile,
  server?: ServerProfileFields | null
): UserProfile {
  const fromCloud = asCloudProfile(cloud);
  const extras = asCloudProfile(server?.extras);
  const useExtras = hasExtras(server?.extras);
  const serverVis =
    server && server.visibility != null
      ? asProfileVisibility(server.visibility)
      : null;
  const serverBio =
    typeof server?.bio === 'string' && server.bio.trim()
      ? server.bio.slice(0, 280)
      : null;
  const source = useExtras ? extras : fromCloud;
  return {
    ...emptyProfile(),
    ...fromCloud,
    ...(useExtras ? extras : {}),
    username: firstFilled(identity?.username, current.username, fromCloud.username),
    displayName: firstFilled(
      identity?.displayName,
      current.displayName,
      fromCloud.displayName
    ),
    visibility: serverVis ?? asProfileVisibility(fromCloud.visibility),
    location: useExtras
      ? String(source.location || '')
      : firstFilled(current.location, fromCloud.location),
    locationLat: useExtras
      ? asCoord(source.locationLat, null)
      : current.locationLat ?? asCoord(fromCloud.locationLat, null),
    locationLon: useExtras
      ? asCoord(source.locationLon, null)
      : current.locationLon ?? asCoord(fromCloud.locationLon, null),
    bio: useExtras
      ? String(source.bio || '').slice(0, 280)
      : firstFilled(serverBio, current.bio, fromCloud.bio).slice(0, 280),
    favoriteGenres: useExtras
      ? asList(source.favoriteGenres, [])
      : current.favoriteGenres.length
        ? current.favoriteGenres
        : asList(fromCloud.favoriteGenres, []),
    favoriteSongs: useExtras
      ? asList(source.favoriteSongs, [])
      : current.favoriteSongs.length
        ? current.favoriteSongs
        : asList(fromCloud.favoriteSongs, []),
    playlists: useExtras
      ? asList(source.playlists, [])
      : current.playlists.length
        ? current.playlists
        : asList(fromCloud.playlists, []),
    musicPathVisibility: useExtras
      ? asProfileVisibility(source.musicPathVisibility)
      : current.musicPathVisibility !== 'private'
        ? current.musicPathVisibility
        : asProfileVisibility(fromCloud.musicPathVisibility),
    sectionOrder: useExtras
      ? asList(source.sectionOrder, emptyProfile().sectionOrder)
      : current.sectionOrder.length
        ? current.sectionOrder
        : asList(fromCloud.sectionOrder, emptyProfile().sectionOrder),
    hiddenSections: useExtras
      ? asList(source.hiddenSections, [])
      : current.hiddenSections.length
        ? current.hiddenSections
        : asList(fromCloud.hiddenSections, []),
    createdAt: firstFilled(
      useExtras ? String(source.createdAt || '') : '',
      String(fromCloud.createdAt || ''),
      current.createdAt
    ),
    totalListens: useExtras
      ? Math.max(0, Math.floor(Number(source.totalListens) || 0))
      : Math.max(current.totalListens || 0, Math.floor(Number(fromCloud.totalListens) || 0)),
    listensByDay: useExtras
      ? ((source.listensByDay as Record<string, number>) || {})
      : {
          ...((fromCloud.listensByDay as Record<string, number>) || {}),
          ...current.listensByDay,
        },
    avatarDataUrl: null,
  };
}
