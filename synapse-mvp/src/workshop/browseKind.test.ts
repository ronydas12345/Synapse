import { describe, expect, it } from 'vitest';
import { WORKSHOP_BROWSE_OPTIONS } from './types';

describe('workshop browse types', () => {
  it('lists users as a catalog category', () => {
    expect(WORKSHOP_BROWSE_OPTIONS.map((option) => option.id)).toEqual([
      'all',
      'playlist',
      'theme',
      'user',
    ]);
  });
});
