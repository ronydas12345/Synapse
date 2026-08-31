/** Structured credits stored on Track nodes. Keep provider-agnostic. */

export type TrackLikeData = {
  songTitle?: unknown;
  artist?: unknown;
  album?: unknown;
  label?: unknown;
  videoId?: unknown;
  metadataStatus?: unknown;
};

export interface TrackDisplayMeta {
  title: string;
  artist: string;
  album: string;
  titleSource: 'songTitle' | 'fallback';
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const GENERIC_TITLES = new Set(['track', 'untitled track', 'untitled']);

export function getTrackDisplayMeta(
  data: TrackLikeData | null | undefined
): TrackDisplayMeta {
  const songTitle = asText(data?.songTitle);
  const artist = asText(data?.artist);
  const album = asText(data?.album);
  const loading = data?.metadataStatus === 'loading';

  if (songTitle && !GENERIC_TITLES.has(songTitle.toLowerCase())) {
    return { title: songTitle, artist, album, titleSource: 'songTitle' };
  }
  if (loading) {
    return { title: 'Looking up…', artist, album, titleSource: 'fallback' };
  }
  return { title: 'No title', artist, album, titleSource: 'fallback' };
}
