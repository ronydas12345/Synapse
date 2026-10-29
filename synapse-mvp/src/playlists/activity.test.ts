import { describe, expect, it } from 'vitest';
import { parsePathActivity } from './activity';

describe('path activity', () => {
  it('keeps valid played rows and drops junk', () => {
    const parsed = parsePathActivity({
      played: [
        { id: 'a', at: '2026-10-26T00:00:00.000Z' },
        { id: 3, at: 'nope' },
        { id: 'b', at: '2026-10-26T01:00:00.000Z' },
      ],
    });
    expect(parsed.played.map((row) => row.id)).toEqual(['a', 'b']);
  });
});
