import { describe, expect, it } from 'vitest';
import {
  artistFromChannel,
  parseArtistTitle,
  stripTitleNoise,
} from './parseCredits';

describe('stripTitleNoise', () => {
  it('removes official-video style brackets', () => {
    expect(
      stripTitleNoise('Bohemian Rhapsody (Official Video)')
    ).toBe('Bohemian Rhapsody');
    expect(stripTitleNoise('Song [Official Audio]')).toBe('Song');
  });
});

describe('artistFromChannel', () => {
  it('strips Topic and Vevo suffixes', () => {
    expect(artistFromChannel('Queen - Topic')).toBe('Queen');
    expect(artistFromChannel('QueenVEVO')).toBe('Queen');
  });
});

describe('parseArtistTitle', () => {
  it('splits Artist - Title', () => {
    expect(
      parseArtistTitle('Queen - Bohemian Rhapsody (Official Video)')
    ).toEqual({
      artist: 'Queen',
      songTitle: 'Bohemian Rhapsody',
    });
  });

  it('uses the channel when the title has no separator', () => {
    expect(parseArtistTitle('Bohemian Rhapsody', 'Queen - Topic')).toEqual({
      artist: 'Queen',
      songTitle: 'Bohemian Rhapsody',
    });
  });
});
