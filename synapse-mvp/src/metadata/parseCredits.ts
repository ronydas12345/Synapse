/** Pull artist / title out of a YouTube video title + channel name. */

const NOISE_PAREN = /\s*[([{][^()[\]{}]*?(official|video|audio|lyric|visualiser|visualizer|hq|4k|hd|remaster|topic|music\s*video)[^()[\]{}]*[)\]}]\s*/gi;

export function stripTitleNoise(title: string): string {
  return title
    .replace(NOISE_PAREN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function artistFromChannel(channelTitle: string): string {
  return channelTitle
    .replace(/\s*-\s*topic$/i, '')
    .replace(/vevo$/i, '')
    .trim();
}

export function parseArtistTitle(
  rawTitle: string,
  channelTitle = ''
): { songTitle: string; artist: string } {
  const cleaned = stripTitleNoise(rawTitle) || rawTitle.trim();
  const separators = [' — ', ' – ', ' - ', ' ~ '];

  for (const sep of separators) {
    const idx = cleaned.indexOf(sep);
    if (idx <= 0) continue;
    const left = cleaned.slice(0, idx).trim();
    const right = stripTitleNoise(cleaned.slice(idx + sep.length));
    if (left && right) {
      return { artist: left, songTitle: right };
    }
  }

  return {
    songTitle: cleaned,
    artist: artistFromChannel(channelTitle),
  };
}
