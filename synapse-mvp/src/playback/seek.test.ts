import { describe, expect, it } from 'vitest';
import { clampSeek, formatClock } from './seek';

describe('clampSeek', () => {
  it('moves forward and backward within the duration', () => {
    expect(clampSeek(40, 10, 100)).toBe(50);
    expect(clampSeek(40, -10, 100)).toBe(30);
  });

  it('clamps to start and end bounds', () => {
    expect(clampSeek(12, -10, 200, 10, 80)).toBe(10);
    expect(clampSeek(75, 10, 200, 10, 80)).toBe(80);
  });

  it('uses duration when end is unset', () => {
    expect(clampSeek(95, 10, 100)).toBe(100);
  });
});

describe('formatClock', () => {
  it('formats mm:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3737)).toBe('1:02:17');
    expect(formatClock(-4)).toBe('0:00');
  });
});
