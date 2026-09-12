import { describe, expect, it } from 'vitest';
import { weatherFromWmo } from './normalize';

describe('weatherFromWmo', () => {
  it('maps WMO codes onto the stable enum', () => {
    expect(weatherFromWmo(0)).toBe('clear');
    expect(weatherFromWmo(2)).toBe('partlyCloudy');
    expect(weatherFromWmo(3)).toBe('cloudy');
    expect(weatherFromWmo(51)).toBe('drizzle');
    expect(weatherFromWmo(61)).toBe('rain');
    expect(weatherFromWmo(71)).toBe('snow');
    expect(weatherFromWmo(95)).toBe('thunderstorm');
    expect(weatherFromWmo(45)).toBe('fog');
    expect(weatherFromWmo(66)).toBe('sleet');
  });

  it('treats strong wind as windy when the sky is otherwise clear', () => {
    expect(weatherFromWmo(0, 55)).toBe('windy');
    expect(weatherFromWmo(61, 80)).toBe('rain');
  });

  it('returns other for unknown codes', () => {
    expect(weatherFromWmo(Number.NaN)).toBe('other');
    expect(weatherFromWmo(999)).toBe('other');
  });
});
