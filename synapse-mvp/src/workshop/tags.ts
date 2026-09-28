export type WorkshopKind = 'playlist' | 'theme';

export interface WorkshopTagDef {
  id: string;
  kind: WorkshopKind;
  category: string;
  categoryLabel: string;
  label: string;
}

export const MAX_WORKSHOP_TAGS = 8;
export const TAG_ID_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

type Pair = readonly [string, string];

const PLAYLIST_GROUPS: { category: string; label: string; tags: Pair[] }[] = [
  {
    category: 'genre',
    label: 'Genre',
    tags: [
      ['rock', 'Rock'],
      ['pop', 'Pop'],
      ['metal', 'Metal'],
      ['punk', 'Punk'],
      ['indie', 'Indie'],
      ['alternative', 'Alternative'],
      ['folk', 'Folk'],
      ['country', 'Country'],
      ['blues', 'Blues'],
      ['jazz', 'Jazz'],
      ['soul', 'Soul'],
      ['rnb', 'R&B'],
      ['funk', 'Funk'],
      ['disco', 'Disco'],
      ['hip-hop', 'Hip-hop'],
      ['rap', 'Rap'],
      ['trap', 'Trap'],
      ['electronic', 'Electronic'],
      ['edm', 'EDM'],
      ['house', 'House'],
      ['techno', 'Techno'],
      ['trance', 'Trance'],
      ['dnb', 'Drum & bass'],
      ['dubstep', 'Dubstep'],
      ['ambient', 'Ambient'],
      ['lo-fi', 'Lo-fi'],
      ['idm', 'IDM'],
      ['synthwave', 'Synthwave'],
      ['vaporwave', 'Vaporwave'],
      ['classical', 'Classical'],
      ['orchestral', 'Orchestral'],
      ['opera', 'Opera'],
      ['choir', 'Choir'],
      ['soundtrack', 'Soundtrack'],
      ['ost', 'OST'],
      ['instrumental', 'Instrumental'],
      ['acoustic', 'Acoustic'],
      ['piano', 'Piano'],
      ['guitar', 'Guitar'],
      ['world', 'World'],
      ['latin', 'Latin'],
      ['reggaeton', 'Reggaeton'],
      ['reggae', 'Reggae'],
      ['ska', 'Ska'],
      ['afrobeats', 'Afrobeats'],
      ['k-pop', 'K-pop'],
      ['j-pop', 'J-pop'],
      ['j-rock', 'J-rock'],
      ['city-pop', 'City pop'],
      ['c-pop', 'C-pop'],
      ['bollywood', 'Bollywood'],
      ['gospel', 'Gospel'],
      ['christian', 'Christian'],
      ['new-age', 'New age'],
      ['experimental', 'Experimental'],
      ['noise', 'Noise'],
      ['industrial', 'Industrial'],
      ['goth', 'Goth'],
      ['emo', 'Emo'],
      ['hardcore', 'Hardcore'],
      ['post-rock', 'Post-rock'],
      ['shoegaze', 'Shoegaze'],
      ['dream-pop', 'Dream pop'],
      ['garage', 'Garage'],
      ['grunge', 'Grunge'],
      ['prog', 'Prog'],
      ['psychedelic', 'Psychedelic'],
      ['soca', 'Soca'],
      ['dancehall', 'Dancehall'],
      ['bossa', 'Bossa nova'],
      ['samba', 'Samba'],
      ['tango', 'Tango'],
      ['flamenco', 'Flamenco'],
      ['celtic', 'Celtic'],
      ['bluegrass', 'Bluegrass'],
      ['americana', 'Americana'],
      ['singer-songwriter', 'Singer-songwriter'],
      ['chillwave', 'Chillwave'],
      ['phonk', 'Phonk'],
      ['hyperpop', 'Hyperpop'],
      ['breakcore', 'Breakcore'],
      ['jungle', 'Jungle'],
      ['uk-garage', 'UK garage'],
      ['grime', 'Grime'],
      ['drill', 'Drill'],
    ],
  },
  {
    category: 'mood',
    label: 'Mood',
    tags: [
      ['chill', 'Chill'],
      ['calm', 'Calm'],
      ['cozy', 'Cozy'],
      ['warm', 'Warm'],
      ['sad', 'Sad'],
      ['melancholy', 'Melancholy'],
      ['happy', 'Happy'],
      ['uplifting', 'Uplifting'],
      ['energetic', 'Energetic'],
      ['aggressive', 'Aggressive'],
      ['dark', 'Dark'],
      ['dreamy', 'Dreamy'],
      ['romantic', 'Romantic'],
      ['nostalgic', 'Nostalgic'],
      ['eerie', 'Eerie'],
      ['hopeful', 'Hopeful'],
      ['angry', 'Angry'],
      ['playful', 'Playful'],
      ['epic', 'Epic'],
      ['cinematic', 'Cinematic'],
      ['mysterious', 'Mysterious'],
      ['peaceful', 'Peaceful'],
      ['intense', 'Intense'],
      ['bittersweet', 'Bittersweet'],
      ['hypnotic', 'Hypnotic'],
      ['glitchy', 'Glitchy'],
      ['spacey', 'Spacey'],
      ['rainy', 'Rainy'],
      ['night', 'Night'],
      ['morning', 'Morning'],
      ['sunset', 'Sunset'],
      ['summer', 'Summer'],
      ['winter', 'Winter'],
      ['autumn', 'Autumn'],
      ['spring', 'Spring'],
    ],
  },
  {
    category: 'activity',
    label: 'Activity',
    tags: [
      ['focus', 'Focus'],
      ['study', 'Study'],
      ['coding', 'Coding'],
      ['work', 'Work'],
      ['reading', 'Reading'],
      ['sleep', 'Sleep'],
      ['workout', 'Workout'],
      ['running', 'Running'],
      ['gym', 'Gym'],
      ['yoga', 'Yoga'],
      ['meditation', 'Meditation'],
      ['party', 'Party'],
      ['dance', 'Dance'],
      ['driving', 'Driving'],
      ['commute', 'Commute'],
      ['cooking', 'Cooking'],
      ['cleaning', 'Cleaning'],
      ['gaming', 'Gaming'],
      ['streaming', 'Streaming'],
      ['writing', 'Writing'],
      ['drawing', 'Drawing'],
      ['walking', 'Walking'],
      ['travel', 'Travel'],
      ['background', 'Background'],
    ],
  },
  {
    category: 'media',
    label: 'Media',
    tags: [
      ['anime', 'Anime'],
      ['manga', 'Manga'],
      ['game', 'Game'],
      ['movie', 'Movie'],
      ['tv', 'TV'],
      ['musical', 'Musical'],
      ['vocaloid', 'Vocaloid'],
      ['touhou', 'Touhou'],
      ['rhythm-game', 'Rhythm game'],
      ['visual-novel', 'Visual novel'],
      ['jrpg', 'JRPG'],
      ['rpg', 'RPG'],
      ['indie-game', 'Indie game'],
      ['arcade', 'Arcade'],
      ['retro-game', 'Retro game'],
      ['cartoon', 'Cartoon'],
      ['documentary', 'Documentary'],
      ['trailer', 'Trailer'],
      ['commercial', 'Commercial'],
      ['radio', 'Radio'],
      ['podcast-safe', 'Podcast-safe'],
      ['covers', 'Covers'],
      ['remixes', 'Remixes'],
      ['mashup', 'Mashup'],
      ['live', 'Live'],
      ['concert', 'Concert'],
      ['karaoke', 'Karaoke'],
      ['choir-arr', 'Choral arrangement'],
    ],
  },
  {
    category: 'era',
    label: 'Era',
    tags: [
      ['50s', '1950s'],
      ['60s', '1960s'],
      ['70s', '1970s'],
      ['80s', '1980s'],
      ['90s', '1990s'],
      ['2000s', '2000s'],
      ['2010s', '2010s'],
      ['2020s', '2020s'],
      ['vintage', 'Vintage'],
      ['retro', 'Retro'],
      ['modern', 'Modern'],
      ['classic', 'Classic'],
      ['oldies', 'Oldies'],
      ['timeless', 'Timeless'],
    ],
  },
  {
    category: 'voice',
    label: 'Voice',
    tags: [
      ['vocals', 'Vocals'],
      ['no-vocals', 'No vocals'],
      ['female-vocals', 'Female vocals'],
      ['male-vocals', 'Male vocals'],
      ['duet', 'Duet'],
      ['acapella', 'A cappella'],
      ['spoken', 'Spoken word'],
      ['multilingual', 'Multilingual'],
      ['english', 'English'],
      ['japanese', 'Japanese'],
      ['korean', 'Korean'],
      ['spanish', 'Spanish'],
      ['french', 'French'],
      ['german', 'German'],
      ['portuguese', 'Portuguese'],
      ['chinese', 'Chinese'],
    ],
  },
  {
    category: 'scene',
    label: 'Scene',
    tags: [
      ['cafe', 'Cafe'],
      ['late-night', 'Late night'],
      ['city', 'City'],
      ['nature', 'Nature'],
      ['beach', 'Beach'],
      ['rain-window', 'Rain window'],
      ['library', 'Library'],
      ['office', 'Office'],
      ['festival', 'Festival'],
      ['club', 'Club'],
      ['road-trip', 'Road trip'],
      ['holiday', 'Holiday'],
      ['christmas', 'Christmas'],
      ['halloween', 'Halloween'],
      ['new-year', 'New year'],
      ['rainy-day', 'Rainy day'],
      ['sunny', 'Sunny'],
      ['after-hours', 'After hours'],
      ['warmup', 'Warmup'],
      ['cooldown-mix', 'Cooldown mix'],
      ['opens', 'Opens'],
      ['closes', 'Closes'],
    ],
  },
];

const THEME_GROUPS: { category: string; label: string; tags: Pair[] }[] = [
  {
    category: 'palette',
    label: 'Palette',
    tags: [
      ['dark', 'Dark'],
      ['light', 'Light'],
      ['black', 'Black'],
      ['white', 'White'],
      ['gray', 'Gray'],
      ['monochrome', 'Monochrome'],
      ['pink', 'Pink'],
      ['red', 'Red'],
      ['orange', 'Orange'],
      ['amber', 'Amber'],
      ['yellow', 'Yellow'],
      ['gold', 'Gold'],
      ['green', 'Green'],
      ['mint', 'Mint'],
      ['teal', 'Teal'],
      ['cyan', 'Cyan'],
      ['blue', 'Blue'],
      ['navy', 'Navy'],
      ['indigo', 'Indigo'],
      ['purple', 'Purple'],
      ['violet', 'Violet'],
      ['lavender', 'Lavender'],
      ['magenta', 'Magenta'],
      ['rose', 'Rose'],
      ['brown', 'Brown'],
      ['cream', 'Cream'],
      ['ivory', 'Ivory'],
      ['pastel', 'Pastel'],
      ['neon', 'Neon'],
      ['muted', 'Muted'],
      ['warm', 'Warm'],
      ['cool', 'Cool'],
      ['earth', 'Earth'],
      ['sunset-color', 'Sunset'],
      ['ocean-color', 'Ocean'],
      ['forest-color', 'Forest'],
      ['blood-red', 'Blood red'],
      ['ice', 'Ice'],
      ['sand', 'Sand'],
      ['copper', 'Copper'],
    ],
  },
  {
    category: 'style',
    label: 'Style',
    tags: [
      ['cute', 'Cute'],
      ['minimal', 'Minimal'],
      ['maximal', 'Maximal'],
      ['retro', 'Retro'],
      ['vintage', 'Vintage'],
      ['modern', 'Modern'],
      ['cyberpunk', 'Cyberpunk'],
      ['synthwave', 'Synthwave'],
      ['vaporwave', 'Vaporwave'],
      ['anime', 'Anime'],
      ['kawaii', 'Kawaii'],
      ['noir', 'Noir'],
      ['brutalist', 'Brutalist'],
      ['glass', 'Glass'],
      ['flat', 'Flat'],
      ['skeuomorph', 'Skeuomorph'],
      ['hand-drawn', 'Hand-drawn'],
      ['pixel', 'Pixel'],
      ['terminal', 'Terminal'],
      ['high-contrast', 'High contrast'],
      ['soft', 'Soft'],
      ['bold', 'Bold'],
      ['elegant', 'Elegant'],
      ['playful', 'Playful'],
      ['serious', 'Serious'],
      ['luxury', 'Luxury'],
      ['utilitarian', 'Utilitarian'],
      ['editorial', 'Editorial'],
      ['poster', 'Poster'],
      ['ui-chrome', 'UI chrome'],
      ['print', 'Print'],
      ['gradient', 'Gradient'],
      ['duotone', 'Duotone'],
      ['triadic', 'Triadic'],
      ['neon-grid', 'Neon grid'],
      ['crt', 'CRT'],
      ['vhs', 'VHS'],
      ['film', 'Film'],
      ['ink', 'Ink'],
      ['paper', 'Paper'],
    ],
  },
  {
    category: 'setting',
    label: 'Setting',
    tags: [
      ['ocean', 'Ocean'],
      ['forest', 'Forest'],
      ['nature', 'Nature'],
      ['space', 'Space'],
      ['city', 'City'],
      ['night-city', 'Night city'],
      ['desert', 'Desert'],
      ['mountain', 'Mountain'],
      ['snow', 'Snow'],
      ['rain', 'Rain'],
      ['garden', 'Garden'],
      ['cafe', 'Cafe'],
      ['library', 'Library'],
      ['studio', 'Studio'],
      ['stage', 'Stage'],
      ['arcade', 'Arcade'],
      ['dungeon', 'Dungeon'],
      ['castle', 'Castle'],
      ['underwater', 'Underwater'],
      ['sky', 'Sky'],
      ['aurora', 'Aurora'],
      ['volcano', 'Volcano'],
      ['meadow', 'Meadow'],
      ['harbor', 'Harbor'],
      ['subway', 'Subway'],
      ['rooftop', 'Rooftop'],
      ['bedroom', 'Bedroom'],
      ['office', 'Office'],
      ['lab', 'Lab'],
      ['temple', 'Temple'],
    ],
  },
  {
    category: 'density',
    label: 'Density',
    tags: [
      ['airy', 'Airy'],
      ['dense', 'Dense'],
      ['compact', 'Compact'],
      ['spacious', 'Spacious'],
      ['sharp', 'Sharp'],
      ['rounded', 'Rounded'],
      ['thin-type', 'Thin type'],
      ['heavy-type', 'Heavy type'],
      ['low-grid', 'Low grid'],
      ['strong-grid', 'Strong grid'],
      ['soft-shadow', 'Soft shadow'],
      ['hard-shadow', 'Hard shadow'],
      ['no-shadow', 'No shadow'],
      ['bordered', 'Bordered'],
      ['borderless', 'Borderless'],
    ],
  },
  {
    category: 'seasonal',
    label: 'Seasonal',
    tags: [
      ['spring', 'Spring'],
      ['summer', 'Summer'],
      ['autumn', 'Autumn'],
      ['winter', 'Winter'],
      ['holiday', 'Holiday'],
      ['christmas', 'Christmas'],
      ['halloween', 'Halloween'],
      ['new-year', 'New year'],
      ['valentine', 'Valentine'],
      ['pride', 'Pride'],
      ['spooky', 'Spooky'],
      ['festive', 'Festive'],
      ['back-to-school', 'Back to school'],
      ['solstice', 'Solstice'],
    ],
  },
  {
    category: 'mood',
    label: 'Mood',
    tags: [
      ['cozy', 'Cozy'],
      ['calm', 'Calm'],
      ['energetic', 'Energetic'],
      ['dreamy', 'Dreamy'],
      ['dramatic', 'Dramatic'],
      ['romantic', 'Romantic'],
      ['mysterious', 'Mysterious'],
      ['cheerful', 'Cheerful'],
      ['somber', 'Somber'],
      ['focus', 'Focus'],
      ['late-night', 'Late night'],
      ['sunrise', 'Sunrise'],
      ['golden-hour', 'Golden hour'],
      ['storm', 'Storm'],
      ['zen', 'Zen'],
      ['hype', 'Hype'],
      ['lo-fi', 'Lo-fi'],
      ['clean', 'Clean'],
      ['messy', 'Messy'],
      ['cinematic', 'Cinematic'],
    ],
  },
];

function flatten(
  kind: WorkshopKind,
  groups: { category: string; label: string; tags: Pair[] }[]
): WorkshopTagDef[] {
  const rows: WorkshopTagDef[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const [id, label] of group.tags) {
      if (!TAG_ID_RE.test(id)) {
        throw new Error(`Invalid Workshop tag id: ${id}`);
      }
      const key = `${kind}:${id}`;
      if (seen.has(key)) {
        throw new Error(`Duplicate Workshop tag: ${key}`);
      }
      seen.add(key);
      rows.push({
        id,
        kind,
        category: group.category,
        categoryLabel: group.label,
        label,
      });
    }
  }
  return rows;
}

export const PLAYLIST_TAGS = flatten('playlist', PLAYLIST_GROUPS);
export const THEME_TAGS = flatten('theme', THEME_GROUPS);
export const WORKSHOP_TAGS: WorkshopTagDef[] = [...PLAYLIST_TAGS, ...THEME_TAGS];

const BY_KIND = {
  playlist: PLAYLIST_TAGS,
  theme: THEME_TAGS,
} as const;

const BY_KEY = new Map(
  WORKSHOP_TAGS.map((tag) => [`${tag.kind}:${tag.id}`, tag] as const)
);

export function tagsForKind(kind: WorkshopKind): WorkshopTagDef[] {
  return BY_KIND[kind];
}

export function tagDef(kind: WorkshopKind, id: string): WorkshopTagDef | undefined {
  return BY_KEY.get(`${kind}:${id}`);
}

export function tagLabel(kind: WorkshopKind, id: string): string {
  return tagDef(kind, id)?.label || id;
}

export function parseTagMap(
  kind: WorkshopKind,
  raw: unknown
): Record<string, string[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const tags = sanitizeTagIds(kind, value);
    if (id && tags.length) out[id] = tags;
  }
  return out;
}

export function sanitizeTagIds(kind: WorkshopKind, raw: unknown): string[] {
  const values = Array.isArray(raw) ? raw : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!TAG_ID_RE.test(id) || seen.has(id) || !tagDef(kind, id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_WORKSHOP_TAGS) break;
  }
  return out;
}

export function filterTagCatalog(
  kind: WorkshopKind,
  query: string
): WorkshopTagDef[] {
  const q = query.trim().toLowerCase();
  const tags = tagsForKind(kind);
  if (!q) return tags;
  return tags.filter(
    (tag) =>
      tag.id.includes(q) ||
      tag.label.toLowerCase().includes(q) ||
      tag.category.includes(q) ||
      tag.categoryLabel.toLowerCase().includes(q)
  );
}

export function tagIdsMatchingQuery(kind: WorkshopKind, query: string): string[] {
  return filterTagCatalog(kind, query).map((tag) => tag.id);
}

export function catalogCategories(kind: WorkshopKind): {
  category: string;
  label: string;
}[] {
  return groupTags(tagsForKind(kind)).map((group) => ({
    category: group.category,
    label: group.label,
  }));
}

export function tagsInCategory(
  kind: WorkshopKind,
  category: string
): WorkshopTagDef[] {
  return tagsForKind(kind).filter((tag) => tag.category === category);
}

export function browseTagCatalog(
  kind: WorkshopKind,
  query: string,
  category = ''
): WorkshopTagDef[] {
  const q = query.trim();
  if (q) return filterTagCatalog(kind, q);
  if (category) return tagsInCategory(kind, category);
  return [];
}

export function groupTags(tags: WorkshopTagDef[]): {
  category: string;
  label: string;
  tags: WorkshopTagDef[];
}[] {
  const groups: {
    category: string;
    label: string;
    tags: WorkshopTagDef[];
  }[] = [];
  const index = new Map<string, number>();
  for (const tag of tags) {
    let at = index.get(tag.category);
    if (at == null) {
      at = groups.length;
      index.set(tag.category, at);
      groups.push({
        category: tag.category,
        label: tag.categoryLabel,
        tags: [],
      });
    }
    groups[at].tags.push(tag);
  }
  return groups;
}
