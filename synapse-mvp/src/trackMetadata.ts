/** Structured credits stored on Track nodes. Keep provider-agnostic. */

export type TrackLikeData = {
  songTitle?: unknown;
  artist?: unknown;
  album?: unknown;
  label?: unknown;
  videoId?: unknown;
};

export interface TrackDisplayMeta {
  title: string;
  artist: string;
  album: string;
  titleSource: 'songTitle' | 'label' | 'videoId' | 'fallback';
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function getTrackDisplayMeta(
  data: TrackLikeData | null | undefined
): TrackDisplayMeta {
  const songTitle = asText(data?.songTitle);
  const label = asText(data?.label);
  const videoId = asText(data?.videoId);
  const artist = asText(data?.artist);
  const album = asText(data?.album);

  if (songTitle) {
    return { title: songTitle, artist, album, titleSource: 'songTitle' };
  }
  if (label) {
    return { title: label, artist, album, titleSource: 'label' };
  }
  if (videoId) {
    return { title: videoId, artist, album, titleSource: 'videoId' };
  }
  return { title: 'Untitled track', artist, album, titleSource: 'fallback' };
}
