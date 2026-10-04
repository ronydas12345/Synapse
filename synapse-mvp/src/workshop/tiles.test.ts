import { describe, expect, it } from 'vitest';
import type { PublicCreator } from '../profiles/api';
import {
  creationUploadedAt,
  formatUploadedAt,
  mixWorkshopTiles,
  sortByUploadedAt,
  uploadedAtMs,
} from './tiles';
import type { WorkshopCard } from './types';

function card(partial: Partial<WorkshopCard> & Pick<WorkshopCard, 'id'>): WorkshopCard {
  return {
    shareCode: partial.id,
    creatorUid: 'u1',
    creatorUsername: 'ada',
    creatorDisplayName: 'Ada',
    title: partial.id,
    description: '',
    kind: 'playlist',
    tags: [],
    featured: false,
    likeCount: 0,
    saveCount: 0,
    remixCount: 0,
    commentCount: 0,
    likesEnabled: true,
    commentsEnabled: true,
    savesEnabled: true,
    publishedAt: null,
    createdAt: null,
    visibility: 'public',
    ...partial,
  };
}

function creator(
  partial: Partial<PublicCreator> & Pick<PublicCreator, 'uid'>
): PublicCreator {
  return {
    username: partial.uid,
    displayName: partial.uid,
    photoUrl: '',
    bio: '',
    equippedDecoration: 'default',
    featuredBadge: '',
    followerCount: 0,
    shareCode: partial.uid,
    followsEnabled: true,
    savesEnabled: true,
    visibility: 'public',
    createdAt: null,
    ...partial,
  };
}

describe('workshop tiles', () => {
  it('prefers published_at for creation upload time', () => {
    expect(
      creationUploadedAt({
        publishedAt: '2026-10-03T12:00:00.000Z',
        createdAt: '2026-09-01T12:00:00.000Z',
      })
    ).toBe('2026-10-03T12:00:00.000Z');
  });

  it('formats upload dates', () => {
    expect(formatUploadedAt('2026-10-03T12:00:00.000Z')).toMatch(/2026/);
    expect(formatUploadedAt(null)).toBeNull();
    expect(uploadedAtMs('nope')).toBe(0);
  });

  it('mixes users, playlists, and themes by upload datetime', () => {
    const tiles = mixWorkshopTiles(
      [
        card({
          id: 'theme-old',
          kind: 'theme',
          publishedAt: '2026-10-01T10:00:00.000Z',
        }),
        card({
          id: 'playlist-new',
          kind: 'playlist',
          publishedAt: '2026-10-03T18:00:00.000Z',
        }),
      ],
      [
        creator({ uid: 'user-mid', createdAt: '2026-10-02T12:00:00.000Z' }),
      ]
    );
    expect(tiles.map((tile) => (tile.type === 'user' ? tile.creator.uid : tile.card.id))).toEqual([
      'playlist-new',
      'user-mid',
      'theme-old',
    ]);
  });

  it('sorts a single type by upload datetime', () => {
    const rows = sortByUploadedAt(
      [
        { id: 'a', at: '2026-09-01T00:00:00.000Z' },
        { id: 'b', at: '2026-10-01T00:00:00.000Z' },
      ],
      (row) => row.at
    );
    expect(rows.map((row) => row.id)).toEqual(['b', 'a']);
  });
});
