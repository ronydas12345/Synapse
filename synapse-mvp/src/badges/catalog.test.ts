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
    expect(DECORATION_CATALOG.find((item) => item.id === 'superadmin')?.ornament).toBe(
      'crown'
    );
  });

  it('gives higher badges a higher visual tier', () => {
    expect(BADGE_CATALOG.find((badge) => badge.id === 'first_creation')?.tier).toBe(1);
    expect(BADGE_CATALOG.find((badge) => badge.id === 'uploads_100')?.tier).toBe(4);
    expect(BADGE_CATALOG.find((badge) => badge.id === 'superadmin')?.tier).toBe(5);
  });
});
