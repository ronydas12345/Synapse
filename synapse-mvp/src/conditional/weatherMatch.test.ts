import { describe, expect, it } from 'vitest';
import { selectWeatherPathIndex } from './weatherMatch';

describe('selectWeatherPathIndex', () => {
  const paths = [
    ['clear'],
    ['rain', 'drizzle'],
    ['other'],
  ] as const;

  it('picks the first path that lists the current state', () => {
    expect(selectWeatherPathIndex([...paths], 'rain')).toBe(1);
    expect(selectWeatherPathIndex([...paths], 'clear')).toBe(0);
  });

  it('falls back to Other / Unknown when the state is unmatched', () => {
    expect(selectWeatherPathIndex([...paths], 'snow')).toBe(2);
  });

  it('uses the last path if nothing matches and no other branch exists', () => {
    expect(selectWeatherPathIndex([['clear'], ['rain']], 'fog')).toBe(1);
  });
});
