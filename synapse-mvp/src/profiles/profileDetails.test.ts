import { describe, expect, it } from 'vitest';
import { mapCreatorProfileDetails } from './profileDetails';

describe('mapCreatorProfileDetails', () => {
  it('keeps public profile extras and drops empty songs', () => {
    const mapped = mapCreatorProfileDetails({
      location: 'Austin, TX',
      locationLat: 30.27,
      locationLon: -97.74,
      bio: 'Building Synapse',
      favoriteGenres: ['Electronic', ''],
      favoriteSongs: [{ videoId: 'dQw4w9wgVcQ', title: 'Song' }, { videoId: '' }],
      playlists: [{ id: '1', name: 'Night mix', visibility: 'public' }],
      hiddenSections: ['activity'],
      totalListens: 12,
      listensByDay: { '2026-10-01': 3 },
    });
    expect(mapped.profile.location).toBe('Austin, TX');
    expect(mapped.profile.favoriteGenres).toEqual(['Electronic']);
    expect(mapped.profile.favoriteSongs).toHaveLength(1);
    expect(mapped.playlists).toEqual([
      { id: '1', name: 'Night mix', visibility: 'public' },
    ]);
    expect(mapped.profile.hiddenSections).toEqual(['activity']);
    expect(mapped.profile.totalListens).toBe(12);
  });
});
