import { describe, expect, it, vi } from 'vitest';
import { lookupTrackCredits } from './lookup';

describe('lookupTrackCredits', () => {
  it('parses oEmbed title and fills album from iTunes', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('noembed.com') || url.includes('/oembed')) {
        return {
          ok: true,
          json: async () => ({
            title: 'Queen - Bohemian Rhapsody (Official Video)',
            author_name: 'Queen Official',
          }),
        } as Response;
      }
      if (url.includes('itunes.apple.com')) {
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                trackName: 'Bohemian Rhapsody',
                artistName: 'Queen',
                collectionName: 'A Night at the Opera',
              },
            ],
          }),
        } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    });

    const credits = await lookupTrackCredits('fJ9rUzIMcZQ', {
      fetch: fetchMock as unknown as typeof fetch,
      youtubeApiKey: '',
      allowDevProxy: false,
      skipCache: true,
    });

    expect(credits).toEqual({
      songTitle: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
    });
  });

  it('returns null when no provider has a title', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));
    const credits = await lookupTrackCredits('aaaaaaaaaaa', {
      fetch: fetchMock as unknown as typeof fetch,
      youtubeApiKey: '',
      allowDevProxy: false,
      skipCache: true,
    });
    expect(credits).toBeNull();
  });
});
