import { describe, expect, it } from 'vitest';
import {
  appHref,
  isAppPath,
  isAuthRoute,
  isMarketingRoute,
  isProtectedRoute,
  pathToRoute,
  routeToUiMode,
} from './routes';

describe('app routes', () => {
  it('maps known paths to pages', () => {
    expect(pathToRoute('/')).toBe('home');
    expect(pathToRoute('/edit')).toBe('edit');
    expect(pathToRoute('/listen/')).toBe('listen');
    expect(pathToRoute('/settings')).toBe('settings');
    expect(pathToRoute('/profile')).toBe('profile');
    expect(pathToRoute('/playground')).toBe('playground');
    expect(isProtectedRoute('playground')).toBe(true);
    expect(isAppPath('/playground')).toBe(true);
    expect(pathToRoute('/workshop')).toBe('workshop');
    expect(pathToRoute('/workshop/11111111-1111-4111-8111-111111111111')).toBe(
      'workshopItem'
    );
    expect(pathToRoute('/u/ada_lovelace')).toBe('publicProfile');
    expect(isAppPath('/workshop/11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isAppPath('/u/ada_lovelace')).toBe(true);
    expect(isAppPath('/u/no')).toBe(false);
    expect(isMarketingRoute('workshopItem')).toBe(true);
    expect(isMarketingRoute('publicProfile')).toBe(true);
    expect(pathToRoute('/pricing')).toBe('pricing');
    expect(pathToRoute('/login')).toBe('login');
    expect(pathToRoute('/signin')).toBe('login');
    expect(pathToRoute('/signup')).toBe('signup');
    expect(pathToRoute('/admin')).toBe('admin');
    expect(pathToRoute('/superadmin')).toBe('superadmin');
    expect(isAuthRoute('login')).toBe(true);
    expect(isMarketingRoute('login')).toBe(false);
    expect(isProtectedRoute('edit')).toBe(true);
    expect(isProtectedRoute('profile')).toBe(true);
    expect(isProtectedRoute('admin')).toBe(true);
    expect(isProtectedRoute('superadmin')).toBe(true);
    expect(isProtectedRoute('home')).toBe(false);
    expect(isProtectedRoute('login')).toBe(false);
  });

  it('treats the site root as home, not edit', () => {
    expect(pathToRoute('/')).toBe('home');
    expect(isAppPath('/')).toBe(true);
    expect(isAppPath('/edit')).toBe(true);
    expect(isAppPath('/workshop')).toBe(true);
    expect(isAppPath('/login')).toBe(true);
    expect(isAppPath('/signin')).toBe(true);
    expect(pathToRoute('/studio')).toBe('home');
    expect(isMarketingRoute('home')).toBe(true);
    expect(isMarketingRoute('edit')).toBe(false);
    expect(appHref('/', 'features')).toBe('/#features');
  });

  it('maps edit to the studio canvas mode', () => {
    expect(routeToUiMode('home')).toBe('home');
    expect(routeToUiMode('edit')).toBe('studio');
    expect(routeToUiMode('listen')).toBe('listen');
    expect(routeToUiMode('profile')).toBe('profile');
    expect(routeToUiMode('workshop')).toBe('home');
    expect(routeToUiMode('login')).toBe('home');
  });
});
