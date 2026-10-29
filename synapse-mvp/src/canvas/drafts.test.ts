import { describe, expect, it } from 'vitest';
import { draftIsNewer, parsePathDraft } from './drafts';

describe('path drafts', () => {
  it('parses a valid draft and rejects junk', () => {
    expect(parsePathDraft(null)).toBeNull();
    expect(
      parsePathDraft({
        version: 1,
        uid: 'u1',
        pathId: 'p1',
        pathName: 'Mine',
        updatedAt: '2026-10-26T00:00:00.000Z',
        nodes: [],
        edges: [],
      })?.pathId
    ).toBe('p1');
  });

  it('treats a draft as newer only when it is clearly ahead of the saved copy', () => {
    expect(
      draftIsNewer('2026-10-26T00:00:02.000Z', '2026-10-26T00:00:00.000Z')
    ).toBe(true);
    expect(
      draftIsNewer('2026-10-26T00:00:00.500Z', '2026-10-26T00:00:00.000Z')
    ).toBe(false);
    expect(draftIsNewer('2026-10-26T00:00:00.000Z', undefined)).toBe(true);
  });
});
