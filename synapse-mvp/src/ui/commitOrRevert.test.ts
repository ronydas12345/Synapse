import { describe, expect, it } from 'vitest';
import { commitNumberOrRevert, commitOrRevert } from './commitOrRevert';

describe('commitOrRevert', () => {
  it('restores the original when the draft is empty or whitespace', () => {
    expect(commitOrRevert('', 'travel')).toBe('travel');
    expect(commitOrRevert('   ', 'travel')).toBe('travel');
  });

  it('keeps a non-empty draft', () => {
    expect(commitOrRevert('techno', 'travel')).toBe('techno');
  });

  it('restores numbers when the field is cleared', () => {
    expect(commitNumberOrRevert('', 100, 25, 200)).toBe(100);
    expect(commitNumberOrRevert('nope', 80)).toBe(80);
    expect(commitNumberOrRevert('150', 100, 25, 200)).toBe(150);
    expect(commitNumberOrRevert('999', 100, 25, 200)).toBe(200);
  });
});
