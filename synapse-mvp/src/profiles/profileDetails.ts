import { extractYouTubeId } from '../playback';
import {
  OPTIONAL_SECTIONS,
  emptyProfile,
  type OptionalSectionId,
  type ProfilePlaylist,
  type UserProfile,
} from '../profile/types';
import { isMissingSchema, supabase, throwIfError } from '../supabase/client';

export type CreatorProfileDetails = {
  profile: UserProfile;
  playlists: ProfilePlaylist[];
};

function asSectionId(value: unknown): OptionalSectionId | null {
  return (OPTIONAL_SECTIONS as readonly string[]).includes(String(value))
    ? (value as OptionalSectionId)
    : null;
}

export function mapCreatorProfileDetails(raw: unknown): CreatorProfileDetails {
  const base = emptyProfile();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { profile: base, playlists: [] };
  }
  const row = raw as Record<string, unknown>;
  const sectionOrder = Array.isArray(row.sectionOrder)
    ? row.sectionOrder.map(asSectionId).filter((id): id is OptionalSectionId => Boolean(id))
    : [];
  for (const id of OPTIONAL_SECTIONS) {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  }
  const hiddenSections = Array.isArray(row.hiddenSections)
    ? row.hiddenSections.map(asSectionId).filter((id): id is OptionalSectionId => Boolean(id))
    : [];
  const favoriteSongs = Array.isArray(row.favoriteSongs)
    ? row.favoriteSongs
        .map((song) => {
          const item = song as { id?: unknown; videoId?: unknown; title?: unknown; artist?: unknown; album?: unknown };
          return {
            id: String(item?.id || ''),
            videoId: extractYouTubeId(String(item?.videoId || '')),
            title: String(item?.title || '').slice(0, 80),
            artist: String(item?.artist || '').slice(0, 80),
            album: String(item?.album || '').slice(0, 80),
          };
        })
        .filter((song) => song.videoId)
        .slice(0, 20)
    : [];
  const playlists = Array.isArray(row.playlists)
    ? row.playlists
        .map((path) => {
          const item = path as {
            id?: unknown;
            name?: unknown;
            visibility?: unknown;
            workshopId?: unknown;
          };
          const workshopId = String(item?.workshopId || '').trim();
          return {
            id: String(item?.id || ''),
            name: String(item?.name || '').slice(0, 60),
            visibility: item?.visibility === 'public' ? ('public' as const) : ('private' as const),
            ...(workshopId ? { workshopId } : {}),
          };
        })
        .filter((path) => path.name)
        .slice(0, 30)
    : [];
  const listensByDay =
    row.listensByDay && typeof row.listensByDay === 'object' && !Array.isArray(row.listensByDay)
      ? (row.listensByDay as Record<string, unknown>)
      : {};
  const safeDays: Record<string, number> = {};
  for (const [key, value] of Object.entries(listensByDay)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(Number(value))) {
      safeDays[key] = Math.max(0, Math.floor(Number(value)));
    }
  }
  const lat = Number(row.locationLat);
  const lon = Number(row.locationLon);
  const profile: UserProfile = {
    ...base,
    location: String(row.location || '').slice(0, 120),
    locationLat: Number.isFinite(lat) ? lat : null,
    locationLon: Number.isFinite(lon) ? lon : null,
    bio: String(row.bio || '').slice(0, 280),
    favoriteGenres: Array.isArray(row.favoriteGenres)
      ? row.favoriteGenres.map((genre) => String(genre).slice(0, 32)).filter(Boolean).slice(0, 24)
      : [],
    favoriteSongs,
    playlists,
    sectionOrder,
    hiddenSections,
    createdAt:
      typeof row.createdAt === 'string' && Number.isFinite(Date.parse(row.createdAt))
        ? row.createdAt
        : base.createdAt,
    totalListens: Math.max(0, Math.floor(Number(row.totalListens) || 0)),
    listensByDay: safeDays,
  };
  return { profile, playlists };
}

export async function readCreatorProfileDetails(
  username: string
): Promise<CreatorProfileDetails | null> {
  const { data, error } = await supabase.rpc('get_creator_profile_details', {
    p_id: username,
  });
  if (isMissingSchema(error)) return null;
  throwIfError(error);
  if (!data || typeof data !== 'object') return null;
  return mapCreatorProfileDetails(data);
}
