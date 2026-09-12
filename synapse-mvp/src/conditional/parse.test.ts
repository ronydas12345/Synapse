import { describe, expect, it } from 'vitest';
import { parsePathDateRules, parsePathWeather } from './parse';

describe('conditional parse', () => {
  it('drops unknown weather strings', () => {
    expect(parsePathWeather([['clear', 'hail', 'rain'], 'nope'], 2)).toEqual([
      ['clear', 'rain'],
      [],
    ]);
  });

  it('keeps structured date clauses and ignores junk', () => {
    const parsed = parsePathDateRules(
      [
        [{ join: 'all', clauses: [{ kind: 'equals', field: 'month', value: 12 }, { kind: 'nope' }] }],
        [{ join: 'any', clauses: [{ kind: 'catchAll' }] }],
      ],
      2
    );
    expect(parsed[0][0].join).toBe('all');
    expect(parsed[0][0].clauses).toEqual([{ kind: 'equals', field: 'month', value: 12 }]);
    expect(parsed[1][0].clauses).toEqual([{ kind: 'catchAll' }]);
  });
});
