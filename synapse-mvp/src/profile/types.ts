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

export const GENRE_PRESET_GROUPS: { label: string; genres: string[] }[] = [
  {
    label: 'Popular',
    genres: [
      'Pop',
      'Rock',
      'Hip-Hop',
      'R&B',
      'Electronic',
      'Indie',
      'Alternative',
      'Dance',
      'Soundtrack',
      'K-Pop',
      'J-Pop',
      'Latin',
      'Country',
    ],
  },
  {
    label: 'Hip-hop, R&B & soul',
    genres: [
      'Rap',
      'Trap',
      'Boom Bap',
      'Drill',
      'Grime',
      'UK Rap',
      'Conscious Rap',
      'Lo-fi Hip-Hop',
      'Phonk',
      'Cloud Rap',
      'Soul',
      'Neo-Soul',
      'Funk',
      'Disco',
      'Motown',
      'Gospel',
    ],
  },
  {
    label: 'Rock, metal & punk',
    genres: [
      'Classic Rock',
      'Punk',
      'Post-Punk',
      'Hardcore',
      'Emo',
      'Shoegaze',
      'Dream Pop',
      'Post-Rock',
      'Math Rock',
      'Prog Rock',
      'Psychedelic Rock',
      'Garage Rock',
      'Grunge',
      'Metal',
      'Heavy Metal',
      'Thrash',
      'Death Metal',
      'Black Metal',
      'Doom',
      'Sludge',
      'Metalcore',
      'Djent',
    ],
  },
  {
    label: 'Electronic & dance',
    genres: [
      'House',
      'Deep House',
      'Techno',
      'Trance',
      'Drum & Bass',
      'Jungle',
      'Dubstep',
      'UK Garage',
      'Breakbeat',
      'IDM',
      'Ambient',
      'Downtempo',
      'Synthwave',
      'Vaporwave',
      'Hyperpop',
      'Industrial',
      'EBM',
      'Chiptune',
      'Footwork',
      'Jersey Club',
    ],
  },
  {
    label: 'Jazz, blues & classical',
    genres: [
      'Jazz',
      'Bebop',
      'Cool Jazz',
      'Free Jazz',
      'Jazz Fusion',
      'Smooth Jazz',
      'Blues',
      'Delta Blues',
      'Classical',
      'Baroque',
      'Opera',
      'Contemporary Classical',
      'Minimalism',
    ],
  },
  {
    label: 'Folk, country & world',
    genres: [
      'Folk',
      'Singer-Songwriter',
      'Americana',
      'Bluegrass',
      'Alt-Country',
      'Reggae',
      'Dub',
      'Ska',
      'Afrobeats',
      'Highlife',
      'Bossa Nova',
      'Samba',
      'Tango',
      'Flamenco',
      'Fado',
      'Celtic',
      'World',
    ],
  },
  {
    label: 'Niche & scene',
    genres: [
      'City Pop',
      'Shibuya-kei',
      'Dungeon Synth',
      'Darkwave',
      'Coldwave',
      'Witch House',
      'Noise',
      'Drone',
      'Field Recording',
      'Musique Concrète',
      'Plunderphonics',
      'Exotica',
      'Lounge',
      'Yacht Rock',
      'Bedroom Pop',
      'Slowcore',
      'Midwest Emo',
      'Riot Grrrl',
      'Queercore',
      'Visual Kei',
      'J-Rock',
      'C-Pop',
      'Mandopop',
      'Cantopop',
      'Amapiano',
      'Gqom',
      'Baile Funk',
      'Reggaeton',
      'Dembow',
      'Dembow Dominicano',
      'Cumbia',
      'Corridos Tumbados',
      'Enka',
      'Kayōkyoku',
      'New Age',
      'Healing',
      'VGM',
      'Anime',
      'Spoken Word',
      'Comedy',
      'Easy Listening',
    ],
  },
];

export const GENRE_PRESETS = GENRE_PRESET_GROUPS.flatMap((group) => group.genres);

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
