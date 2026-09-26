import { describe, expect, it } from 'vitest';
import { BADGE_CATALOG } from './catalog';
import { DECORATION_CATALOG } from '../decorations/catalog';

describe('phase 1 catalogs', () => {
  it('includes the required badges', () => {
    expect(BADGE_CATALOG.map((badge) => badge.id).sort()).toEqual(
      [
        'admin',
        'first_creation',
        'followers_10',
        'followers_100',
        'one_month',
        'one_year',
        'superadmin',
        'uploads_10',
        'uploads_100',
        'uploads_25',
        'first_game',
        'tokens_100',
        'tokens_1000',
        'game_explorer',
        'perfect_score',
      ].sort()
    );
  });

  it('includes the required decorations', () => {
    expect(DECORATION_CATALOG.map((item) => item.id)).toEqual([
      'default',
      'one_month',
      'one_year',
      'creator',
      'admin',
      'superadmin',
    ]);
  });
});
