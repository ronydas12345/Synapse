import { describe, expect, it } from 'vitest';
import { getTrackDisplayMeta } from './trackMetadata';

describe('getTrackDisplayMeta', () => {
  it('uses songTitle and ignores the generic Track label', () => {
    expect(
      getTrackDisplayMeta({
        songTitle: 'Bohemian Rhapsody',
        label: 'Track',
        videoId: 'abc',
        artist: 'Queen',
        album: 'A Night at the Opera',
      })
    ).toEqual({
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      titleSource: 'songTitle',
    });
  });

  it('does not display Track, the video ID, or the default label as a title', () => {
    expect(getTrackDisplayMeta({ label: 'Track' }).title).toBe('No title');
    expect(getTrackDisplayMeta({ songTitle: 'Track' }).title).toBe('No title');
    expect(getTrackDisplayMeta({ videoId: 'dQw4w9wgVcQ' }).title).toBe('No title');
    expect(getTrackDisplayMeta({}).title).toBe('No title');
  });

  it('shows a lookup placeholder while metadata is loading', () => {
    expect(
      getTrackDisplayMeta({ metadataStatus: 'loading', videoId: 'abc' }).title
    ).toBe('Looking up…');
  });

  it('trims whitespace and treats blank strings as empty', () => {
    const meta = getTrackDisplayMeta({
      songTitle: '  Hello  ',
      artist: '   ',
      album: '\n',
    });
    expect(meta.title).toBe('Hello');
    expect(meta.artist).toBe('');
    expect(meta.album).toBe('');
  });

  it('survives missing or non-string data', () => {
    expect(getTrackDisplayMeta(undefined).title).toBe('No title');
    expect(
      getTrackDisplayMeta({
        songTitle: 12,
        artist: null,
        album: { name: 'nope' },
      })
    ).toEqual({
      title: 'No title',
      artist: '',
      album: '',
      titleSource: 'fallback',
    });
  });
});
