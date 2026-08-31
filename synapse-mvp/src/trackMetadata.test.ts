import { describe, expect, it } from 'vitest';
import { getTrackDisplayMeta } from './trackMetadata';

describe('getTrackDisplayMeta', () => {
  it('prefers songTitle over label and videoId', () => {
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

  it('falls back to label, then videoId, then Untitled track', () => {
    expect(getTrackDisplayMeta({ label: 'Track' }).title).toBe('Track');
    expect(getTrackDisplayMeta({ label: 'Track' }).titleSource).toBe('label');
    expect(getTrackDisplayMeta({ videoId: 'dQw4w9wgVcQ' })).toMatchObject({
      title: 'dQw4w9wgVcQ',
      titleSource: 'videoId',
    });
    expect(getTrackDisplayMeta({})).toMatchObject({
      title: 'Untitled track',
      titleSource: 'fallback',
    });
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
    expect(getTrackDisplayMeta(undefined).title).toBe('Untitled track');
    expect(
      getTrackDisplayMeta({
        songTitle: 12,
        artist: null,
        album: { name: 'nope' },
      })
    ).toEqual({
      title: 'Untitled track',
      artist: '',
      album: '',
      titleSource: 'fallback',
    });
  });
});
