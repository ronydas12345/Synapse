import { describe, expect, it } from 'vitest';
import {
  activityRangeStart,
  buildListenHeatmap,
  computeStreaks,
  heatmapLevel,
  localDayKey,
  rollingWindowStart,
  shiftDayKey,
  yearBounds,
} from './listenStats';

describe('listen streaks', () => {
  it('is zero with no listen days', () => {
    expect(computeStreaks({}, '2026-09-13')).toEqual({
      current: 0,
      longest: 0,
      activeDays: 0,
      lastListenDay: null,
      bestDay: null,
      bestDayCount: 0,
    });
  });

  it('keeps current streak alive through today when yesterday was active', () => {
    const streaks = computeStreaks(
      {
        '2026-09-11': 1,
        '2026-09-12': 2,
      },
      '2026-09-13'
    );
    expect(streaks.current).toBe(2);
    expect(streaks.longest).toBe(2);
  });

  it('includes today in the current streak', () => {
    const streaks = computeStreaks(
      {
        '2026-09-11': 1,
        '2026-09-12': 1,
        '2026-09-13': 4,
      },
      '2026-09-13'
    );
    expect(streaks.current).toBe(3);
    expect(streaks.bestDay).toBe('2026-09-13');
    expect(streaks.bestDayCount).toBe(4);
  });

  it('breaks current streak after a missed day', () => {
    const streaks = computeStreaks(
      {
        '2026-09-08': 1,
        '2026-09-09': 1,
        '2026-09-10': 1,
        '2026-09-12': 1,
      },
      '2026-09-13'
    );
    expect(streaks.current).toBe(1);
    expect(streaks.longest).toBe(3);
    expect(streaks.activeDays).toBe(4);
  });
});

describe('listen heatmap', () => {
  it('starts from the earlier of createdAt and the first listen', () => {
    expect(
      activityRangeStart('2026-09-10T12:00:00.000Z', { '2026-09-01': 2 })
    ).toBe('2026-09-01');
  });

  it('pads weeks from Sunday and covers every day in range', () => {
    const heatmap = buildListenHeatmap({ '2026-09-13': 3 }, '2026-09-13', '2026-09-13');
    expect(heatmap.weeks[0].days).toHaveLength(7);
    expect(heatmap.weeks[0].days[0].date).toBe('2026-09-13');
    const today = heatmap.weeks.flatMap((week) => week.days).find((cell) => cell.date === '2026-09-13');
    expect(today?.count).toBe(3);
    expect(today?.inRange).toBe(true);
    expect(heatmap.totalInRange).toBe(3);
  });

  it('dims days before the profile became active', () => {
    const heatmap = buildListenHeatmap({}, '2026-08-01', '2026-09-13', '2026-09-05');
    const before = heatmap.weeks.flatMap((week) => week.days).find((cell) => cell.date === '2026-09-01');
    const after = heatmap.weeks.flatMap((week) => week.days).find((cell) => cell.date === '2026-09-06');
    expect(before?.inRange).toBe(false);
    expect(after?.inRange).toBe(true);
  });

  it('opens a 53-week rolling window', () => {
    expect(rollingWindowStart('2026-09-13')).toBe('2025-09-14');
  });

  it('labels each month across a year-long heatmap', () => {
    const heatmap = buildListenHeatmap({}, '2025-09-14', '2026-09-13', '2026-09-05');
    expect(heatmap.months.length).toBeGreaterThanOrEqual(12);
    expect(heatmap.months[0]?.label).toMatch(/Sep/i);
  });

  it('scales levels against the peak day', () => {
    expect(heatmapLevel(0, 8)).toBe(0);
    expect(heatmapLevel(1, 8)).toBe(1);
    expect(heatmapLevel(3, 8)).toBe(2);
    expect(heatmapLevel(6, 8)).toBe(3);
    expect(heatmapLevel(8, 8)).toBe(4);
  });

  it('clamps a year to the account range', () => {
    expect(yearBounds(2026, '2026-09-01', '2026-09-13')).toEqual({
      start: '2026-09-01',
      end: '2026-09-13',
    });
  });

  it('shifts local calendar days across month boundaries', () => {
    expect(shiftDayKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(localDayKey(new Date(2026, 8, 13))).toBe('2026-09-13');
  });
});
