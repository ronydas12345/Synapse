import { getCachedCredits, setCachedCredits } from './cache';
import { parseArtistTitle } from './parseCredits';
import type { TrackCredits } from './types';

export type LookupDeps = {
  fetch?: typeof fetch;
  youtubeApiKey?: string;
  allowDevProxy?: boolean;
  skipCache?: boolean;
};

type FetchFn = typeof fetch;

function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

async function readJson(fetchFn: FetchFn, url: string): Promise<unknown | null> {
  try {
    const res = await fetchFn(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

async function fromYouTubeDataApi(
  videoId: string,
  fetchFn: FetchFn,
  apiKey: string
): Promise<{ title: string; channel: string } | null> {
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}` +
    `&key=${encodeURIComponent(apiKey)}`;
  const json = asRecord(await readJson(fetchFn, url));
  const items = Array.isArray(json?.items) ? json.items : [];
  const snippet = asRecord(asRecord(items[0])?.snippet);
  const title = typeof snippet?.title === 'string' ? snippet.title : '';
  const channel =
    typeof snippet?.channelTitle === 'string' ? snippet.channelTitle : '';
  if (!title) return null;
  return { title, channel };
}

async function fromOEmbed(
  videoId: string,
  fetchFn: FetchFn,
  allowDevProxy: boolean
): Promise<{ title: string; channel: string } | null> {
  const watch = encodeURIComponent(youtubeWatchUrl(videoId));
  const urls = [
    `https://www.youtube.com/oembed?url=${watch}&format=json`,
    `https://noembed.com/embed?url=${watch}`,
  ];
  if (allowDevProxy) {
    urls.splice(1, 0, `/api/yt-oembed?url=${watch}&format=json`);
  }

  for (const url of urls) {
    const json = asRecord(await readJson(fetchFn, url));
    const title = typeof json?.title === 'string' ? json.title : '';
    const channel =
      typeof json?.author_name === 'string' ? json.author_name : '';
    if (title) return { title, channel };
  }
  return null;
}

function scoreItunes(
  trackName: string,
  artistName: string,
  songTitle: string,
  artist: string
): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const t = norm(songTitle);
  const a = norm(artist);
  const nt = norm(trackName);
  const na = norm(artistName);
  let score = 0;
  if (nt === t) score += 4;
  else if (nt.includes(t) || t.includes(nt)) score += 1;
  if (a && na === a) score += 4;
  else if (a && (na.includes(a) || a.includes(na))) score += 1;
  return score;
}

async function fromItunes(
  songTitle: string,
  artist: string,
  fetchFn: FetchFn
): Promise<TrackCredits | null> {
  const term = [artist, songTitle].filter(Boolean).join(' ').trim();
  if (!term) return null;
  const url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}` +
    `&media=music&entity=song&limit=8`;
  const json = asRecord(await readJson(fetchFn, url));
  const results = Array.isArray(json?.results) ? json.results : [];
  let best: Record<string, unknown> | null = null;
  let bestScore = -1;
  for (const item of results) {
    const rec = asRecord(item);
    if (!rec) continue;
    const trackName = typeof rec.trackName === 'string' ? rec.trackName : '';
    const artistName = typeof rec.artistName === 'string' ? rec.artistName : '';
    const score = scoreItunes(trackName, artistName, songTitle, artist);
    if (score > bestScore) {
      bestScore = score;
      best = rec;
    }
  }
  if (!best || bestScore < 1) return null;
  return {
    songTitle:
      typeof best.trackName === 'string' ? best.trackName : songTitle,
    artist: typeof best.artistName === 'string' ? best.artistName : artist,
    album: typeof best.collectionName === 'string' ? best.collectionName : '',
  };
}

export async function lookupTrackCredits(
  videoId: string,
  deps: LookupDeps = {}
): Promise<TrackCredits | null> {
  const id = videoId.trim();
  if (!id) return null;

  if (!deps.skipCache) {
    const cached = getCachedCredits(id);
    if (cached) {
      return {
        songTitle: cached.songTitle,
        artist: cached.artist,
        album: cached.album,
      };
    }
  }

  const fetchFn = deps.fetch ?? fetch;
  const allowDevProxy = deps.allowDevProxy ?? Boolean(import.meta.env.DEV);
  const apiKey =
    deps.youtubeApiKey ?? String(import.meta.env.VITE_YOUTUBE_API_KEY || '');

  const yt = apiKey
    ? await fromYouTubeDataApi(id, fetchFn, apiKey)
    : null;
  const oembed = yt ?? (await fromOEmbed(id, fetchFn, allowDevProxy));
  if (!oembed) return null;

  const parsed = parseArtistTitle(oembed.title, oembed.channel);
  const itunes = await fromItunes(parsed.songTitle, parsed.artist, fetchFn);

  const credits: TrackCredits = {
    songTitle: itunes?.songTitle || parsed.songTitle,
    artist: itunes?.artist || parsed.artist,
    album: itunes?.album || '',
  };

  if (!deps.skipCache) {
    setCachedCredits(id, credits, yt ? 'youtube-data' : 'oembed+itunes');
  }
  return credits;
}
