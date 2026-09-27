import { describe, expect, it } from 'vitest';
import { isShareCode, isWorkshopShareKey, workshopSharePath, profileSharePath } from './ids';

describe('share ids', () => {
  it('accepts 10-character share codes and UUIDs', () => {
    expect(isShareCode('a2b3c4d5e6')).toBe(true);
    expect(isShareCode('abcdefghij')).toBe(true);
    expect(isShareCode('abcdefghlj')).toBe(false);
    expect(isShareCode('abcdefghio')).toBe(false);
    expect(isShareCode('too-short')).toBe(false);
    expect(isWorkshopShareKey('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isWorkshopShareKey('a2b3c4d5e6')).toBe(true);
    expect(workshopSharePath('a2b3c4d5e6')).toBe('/p/a2b3c4d5e6');
    expect(workshopSharePath('11111111-1111-4111-8111-111111111111')).toBe(
      '/workshop/11111111-1111-4111-8111-111111111111'
    );
    expect(profileSharePath('ada_lovelace')).toBe('/u/ada_lovelace');
  });
});
