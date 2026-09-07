import { describe, expect, it } from 'vitest';
import {
  appHref,
  isAppPath,
  isMarketingRoute,
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
    expect(pathToRoute('/workshop')).toBe('workshop');
    expect(pathToRoute('/pricing')).toBe('pricing');
  });

  it('treats the site root as home, not edit', () => {
    expect(pathToRoute('/')).toBe('home');
    expect(isAppPath('/')).toBe(true);
    expect(isAppPath('/edit')).toBe(true);
    expect(isAppPath('/workshop')).toBe(true);
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
  });
});
