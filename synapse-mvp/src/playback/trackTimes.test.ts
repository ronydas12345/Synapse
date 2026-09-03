import { describe, expect, it } from 'vitest';
import { clampTrackTimes, displayEndTime, parseClock } from './trackTimes';

describe('clampTrackTimes', () => {
  it('caps end and start to duration', () => {
    expect(clampTrackTimes(10, 500, 243.7)).toEqual({
      startTime: 10,
      endTime: 243.7,
      duration: 243.7,
    });
  });

  it('keeps zero end as full-length sentinel', () => {
    expect(clampTrackTimes(0, 0, 100)).toEqual({
      startTime: 0,
      endTime: 0,
      duration: 100,
    });
  });

  it('pulls start back when it passes end', () => {
    expect(clampTrackTimes(80, 40, 100).startTime).toBe(40);
  });
});

describe('displayEndTime', () => {
  it('shows duration when end is unset', () => {
    expect(displayEndTime(0, 243.7)).toBe(243.7);
  });
});

describe('parseClock', () => {
  it('parses mm:ss and h:mm:ss', () => {
    expect(parseClock('1:25')).toBe(85);
    expect(parseClock('1:02:17')).toBe(3737);
    expect(parseClock('42')).toBe(42);
  });
});
