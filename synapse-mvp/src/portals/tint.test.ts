import { describe, expect, it } from 'vitest';
import { portalColorKind } from './tint';

describe('portalColorKind', () => {
  it('is blue (start) for a playlist-beginning destination', () => {
    expect(
      portalColorKind({
        type: 'internal',
        playlistId: 'b',
        mode: 'playlist_start',
        portalId: '',
      })
    ).toBe('start');
  });

  it('is purple (hop) when the destination is a specific portal', () => {
    expect(
      portalColorKind({
        type: 'internal',
        playlistId: 'b',
        mode: 'portal',
        portalId: 'P-DST11DST',
      })
    ).toBe('hop');
  });

  it('is purple for an entry portal that receives from another playlist', () => {
    expect(portalColorKind(null, 'entry')).toBe('hop');
  });

  it('defaults unset portals to the beginning color', () => {
    expect(portalColorKind(null, 'unset')).toBe('start');
  });
});
