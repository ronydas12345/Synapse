import { describe, expect, it } from 'vitest';
import { isReturnPath } from './returnPath';

describe('auth return path', () => {
  it('only keeps workspace destinations', () => {
    expect(isReturnPath('/edit')).toBe(true);
    expect(isReturnPath('/listen/')).toBe(true);
    expect(isReturnPath('/settings')).toBe(true);
    expect(isReturnPath('/profile')).toBe(true);
    expect(isReturnPath('/admin')).toBe(true);
    expect(isReturnPath('/superadmin')).toBe(true);
    expect(isReturnPath('/')).toBe(false);
    expect(isReturnPath('/login')).toBe(false);
    expect(isReturnPath('https://evil.example')).toBe(false);
  });
});
