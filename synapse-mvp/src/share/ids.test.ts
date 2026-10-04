import { describe, expect, it } from 'vitest';
import {
  isShareCode,
  isWorkshopItemSegment,
  isWorkshopShareKey,
  workshopSharePath,
  profileSharePath,
} from './ids';

describe('share ids', () => {
  it('accepts 10-character share codes and UUIDs', () => {
    expect(isShareCode('a2b3c4d5e6')).toBe(true);
    expect(isShareCode('abcdefghij')).toBe(true);
    expect(isShareCode('gaudde8vo6')).toBe(true);
    expect(isShareCode('abcdefghlj')).toBe(false);
    expect(isShareCode('abcdefghio')).toBe(true);
    expect(isShareCode('too-short')).toBe(false);
    expect(isWorkshopShareKey('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isWorkshopShareKey('a2b3c4d5e6')).toBe(true);
    expect(workshopSharePath('a2b3c4d5e6')).toBe('/playlist/a2b3c4d5e6');
    expect(workshopSharePath('gaudde8vo6')).toBe('/playlist/gaudde8vo6');
    expect(workshopSharePath('11111111-1111-4111-8111-111111111111')).toBe(
      '/playlist/11111111-1111-4111-8111-111111111111'
    );
    expect(profileSharePath('ada_lovelace')).toBe('/u/ada_lovelace');
    expect(isWorkshopItemSegment('gaudde8vo6')).toBe(true);
    expect(isWorkshopItemSegment('not')).toBe(false);
  });
});
