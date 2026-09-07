export const OPTIONAL_SECTIONS = [
  'location',
  'bio',
  'genres',
  'songs',
  'playlists',
  'stats',
  'activity',
] as const;

export type OptionalSectionId = (typeof OPTIONAL_SECTIONS)[number];

export type ProfileVisibility = 'public' | 'private';

export interface FavoriteSong {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
}

export interface ProfilePlaylist {
  id: string;
  name: string;
  visibility: ProfileVisibility;
}

export interface UserProfile {
  schemaVersion: 1;
  username: string;
  displayName: string;
  visibility: ProfileVisibility;
  avatarDataUrl: string | null;
  location: string;
  locationLat: number | null;
  locationLon: number | null;
  bio: string;
  favoriteGenres: string[];
  favoriteSongs: FavoriteSong[];
  playlists: ProfilePlaylist[];
  musicPathVisibility: ProfileVisibility;
  sectionOrder: OptionalSectionId[];
  hiddenSections: OptionalSectionId[];
  createdAt: string;
  totalListens: number;
  listensByDay: Record<string, number>;
}

export const GENRE_PRESETS = [
  'Rock',
  'Pop',
  'Hip-Hop',
  'Electronic',
  'Jazz',
  'Classical',
  'Metal',
  'R&B',
  'Folk',
  'Ambient',
  'Soundtrack',
  'Indie',
];

export const SECTION_LABELS: Record<OptionalSectionId, string> = {
  location: 'Location',
  bio: 'Bio',
  genres: 'Favorite genres',
  songs: 'Favorite songs',
  playlists: 'Playlists',
  stats: 'Listening stats',
  activity: 'Activity',
};

export function emptyProfile(): UserProfile {
  return {
    schemaVersion: 1,
    username: '',
    displayName: '',
    visibility: 'private',
    avatarDataUrl: null,
    location: '',
    locationLat: null,
    locationLon: null,
    bio: '',
    favoriteGenres: [],
    favoriteSongs: [],
    playlists: [],
    musicPathVisibility: 'private',
    sectionOrder: [...OPTIONAL_SECTIONS],
    hiddenSections: [],
    createdAt: new Date().toISOString(),
    totalListens: 0,
    listensByDay: {},
  };
}
