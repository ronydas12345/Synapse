import { describe, expect, it } from 'vitest';
import { clauseMatches, calendarParts, selectDatePathIndex } from './dateMatch';
import type { DateRule } from './types';

describe('date clauses', () => {
  const monday = new Date(2026, 8, 7, 10, 0, 0); // Mon Sep 7 2026
  const parts = calendarParts(monday);

  it('matches weekday lists and ranges', () => {
    expect(parts.weekday).toBe(1);
    expect(
      clauseMatches({ kind: 'in', field: 'weekday', values: [1, 2, 3, 4, 5] }, parts)
    ).toBe(true);
    expect(
      clauseMatches({ kind: 'range', field: 'weekday', start: 5, end: 0 }, parts)
    ).toBe(false);
    expect(
      clauseMatches({ kind: 'equals', field: 'month', value: 9 }, parts)
    ).toBe(true);
  });

  it('matches annual ranges that wrap the year', () => {
    expect(
      clauseMatches(
        { kind: 'annualRange', startMonth: 12, startDay: 1, endMonth: 1, endDay: 5 },
        parts
      )
    ).toBe(false);
    const nye = calendarParts(new Date(2026, 11, 31));
    expect(
      clauseMatches(
        { kind: 'annualRange', startMonth: 12, startDay: 1, endMonth: 1, endDay: 5 },
        nye
      )
    ).toBe(true);
  });

  it('selects the first matching path, then catch-all', () => {
    const rules: DateRule[][] = [
      [{ join: 'any', clauses: [{ kind: 'in', field: 'weekday', values: [1, 2, 3, 4, 5] }] }],
      [{ join: 'any', clauses: [{ kind: 'in', field: 'weekday', values: [0, 6] }] }],
      [{ join: 'any', clauses: [{ kind: 'catchAll' }] }],
    ];
    expect(selectDatePathIndex(rules, monday)).toBe(0);
    expect(selectDatePathIndex(rules, new Date(2026, 8, 12))).toBe(1); // Saturday
  });
});
