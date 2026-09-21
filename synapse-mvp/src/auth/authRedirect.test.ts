import { describe, expect, it } from 'vitest';
import {
  incompleteUserRedirect,
  shouldDeferIncompleteRedirect,
} from './authRedirect';

describe('incomplete user redirect', () => {
  it('sends unfinished accounts to signup only from protected pages', () => {
    expect(incompleteUserRedirect('edit')).toBe('/signup');
    expect(incompleteUserRedirect('profile')).toBe('/signup');
    expect(incompleteUserRedirect('admin')).toBe('/signup');
  });

  it('does not bounce Log in back to Create account', () => {
    expect(incompleteUserRedirect('login')).toBeNull();
    expect(incompleteUserRedirect('signup')).toBeNull();
    expect(incompleteUserRedirect('home')).toBeNull();
  });

  it('waits for workspace hydrate before treating a session as unfinished', () => {
    expect(shouldDeferIncompleteRedirect('idle')).toBe(true);
    expect(shouldDeferIncompleteRedirect('loading')).toBe(true);
    expect(shouldDeferIncompleteRedirect('ready')).toBe(false);
  });
});
