import { documentPrefersReducedMotion } from '../settings/motion';
import { isWorkshopItemSegment, SHARE_CODE_RE } from '../share/ids';
import { scrollWithin } from '../ui/scrollWithin';

export type AppRoute =
  | 'home'
  | 'workshop'
  | 'workshopItem'
  | 'publicProfile'
  | 'shareLookup'
  | 'pricing'
  | 'changelog'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'login'
  | 'signup'
  | 'edit'
  | 'listen'
  | 'settings'
  | 'profile'
  | 'admin'
  | 'superadmin';

export const CREATION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PUBLIC_USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export { SHARE_CODE_RE };

export type AppLocation = {
  route: AppRoute;
  workshopId?: string;
  username?: string;
  shareRef?: string;
};

export type AppPath =
  | '/'
  | '/workshop'
  | '/pricing'
  | '/changelog'
  | '/faq'
  | '/privacy'
  | '/terms'
  | '/cookies'
  | '/login'
  | '/signup'
  | '/signin'
  | '/edit'
  | '/listen'
  | '/settings'
  | '/profile'
  | '/admin'
  | '/superadmin';

export function workshopItemPath(id: string): string {
  return `/playlist/${id.trim().toLowerCase()}`;
}

export function listenPath(id?: string): string {
  const key = id?.trim().toLowerCase();
  if (!key) return '/listen';
  return `/listen/${key}`;
}

export function isListenHref(path: string): boolean {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/listen') return true;
  const hit = p.match(/^\/listen\/([^/]+)$/);
  return Boolean(hit && isWorkshopItemSegment(hit[1]));
}

export function publicProfilePath(username: string): string {
  return `/u/${username.trim().toLowerCase()}`;
}

export function shareLookupPath(id: string): string {
  return `/s/${id.trim().toLowerCase()}`;
}

export type StaticAppRoute = Exclude<
  AppRoute,
  'workshopItem' | 'publicProfile' | 'shareLookup'
>;

export const APP_PATHS: Record<StaticAppRoute, AppPath> = {
  home: '/',
  workshop: '/workshop',
  pricing: '/pricing',
  changelog: '/changelog',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  login: '/login',
  signup: '/signup',
  edit: '/edit',
  listen: '/listen',
  settings: '/settings',
  profile: '/profile',
  admin: '/admin',
  superadmin: '/superadmin',
};

const PATH_SET = new Set<string>([...Object.values(APP_PATHS), '/signin']);

const MARKETING: ReadonlySet<AppRoute> = new Set([
  'home',
  'workshop',
  'workshopItem',
  'publicProfile',
  'shareLookup',
  'pricing',
  'changelog',
  'faq',
  'privacy',
  'terms',
  'cookies',
]);

export function isMarketingRoute(route: AppRoute): boolean {
  return MARKETING.has(route);
}

export function isWorkspaceRoute(
  route: AppRoute
): route is 'edit' | 'listen' | 'settings' | 'profile' {
  return (
    route === 'edit' ||
    route === 'listen' ||
    route === 'settings' ||
    route === 'profile'
  );
}

export function isStaffRoute(route: AppRoute): route is 'admin' | 'superadmin' {
  return route === 'admin' || route === 'superadmin';
}

export function isAuthRoute(route: AppRoute): route is 'login' | 'signup' {
  return route === 'login' || route === 'signup';
}

export function isProtectedRoute(
  route: AppRoute
): route is 'edit' | 'listen' | 'settings' | 'profile' | 'admin' | 'superadmin' {
  return isWorkspaceRoute(route) || isStaffRoute(route);
}

function workshopIdFromPath(pathname: string): string | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  const hit = p.match(/^\/(?:playlist|p|workshop)\/([^/]+)$/);
  if (!hit) return null;
  const key = hit[1];
  if (!isWorkshopItemSegment(key)) return null;
  return key.toLowerCase();
}

export function parseAppLocation(pathname: string): AppLocation {
  const p = pathname.replace(/\/+$/, '') || '/';
  const workshopId = workshopIdFromPath(p);
  if (workshopId) {
    return { route: 'workshopItem', workshopId };
  }
  const profile = p.match(/^\/u\/([^/]+)$/);
  if (profile && (PUBLIC_USERNAME_RE.test(profile[1]) || SHARE_CODE_RE.test(profile[1]))) {
    return { route: 'publicProfile', username: profile[1].toLowerCase() };
  }
  const lookup = p.match(/^\/s\/([^/]+)$/);
  if (
    lookup &&
    (isWorkshopItemSegment(lookup[1]) || PUBLIC_USERNAME_RE.test(lookup[1]))
  ) {
    return { route: 'shareLookup', shareRef: lookup[1].toLowerCase() };
  }
  if (p === '/') return { route: 'home' };
  if (p === '/workshop') return { route: 'workshop' };
  if (p === '/pricing') return { route: 'pricing' };
  if (p === '/changelog') return { route: 'changelog' };
  if (p === '/faq') return { route: 'faq' };
  if (p === '/privacy') return { route: 'privacy' };
  if (p === '/terms') return { route: 'terms' };
  if (p === '/cookies') return { route: 'cookies' };
  if (p === '/login' || p === '/signin') return { route: 'login' };
  if (p === '/signup') return { route: 'signup' };
  if (p === '/edit') return { route: 'edit' };
  if (p === '/listen') return { route: 'listen' };
  const listenHit = p.match(/^\/listen\/([^/]+)$/);
  if (listenHit && isWorkshopItemSegment(listenHit[1])) {
    return { route: 'listen', workshopId: listenHit[1].toLowerCase() };
  }
  if (p === '/settings') return { route: 'settings' };
  if (p === '/profile') return { route: 'profile' };
  if (p === '/admin') return { route: 'admin' };
  if (p === '/superadmin') return { route: 'superadmin' };
  return { route: 'home' };
}

export function pathToRoute(pathname: string): AppRoute {
  return parseAppLocation(pathname).route;
}

export function routeToUiMode(
  route: AppRoute
): 'home' | 'studio' | 'listen' | 'settings' | 'profile' {
  if (route === 'edit') return 'studio';
  if (route === 'listen') return 'listen';
  if (route === 'settings') return 'settings';
  if (route === 'profile') return 'profile';
  return 'home';
}

export function isAppPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (PATH_SET.has(p)) return true;
  if (isListenHref(p)) return true;
  if (workshopIdFromPath(p)) return true;
  if (/^\/u\/[^/]+$/.test(p)) {
    const handle = p.slice('/u/'.length);
    if (PUBLIC_USERNAME_RE.test(handle) || SHARE_CODE_RE.test(handle)) return true;
  }
  if (/^\/s\/[^/]+$/.test(p)) {
    const ref = p.slice('/s/'.length);
    if (isWorkshopItemSegment(ref) || PUBLIC_USERNAME_RE.test(ref)) return true;
  }
  return false;
}

export function appHref(path: string, hash = ''): string {
  if (!hash) return path;
  return `${path}#${hash}`;
}

function scrollToHash(hash: string): void {
  const el = document.getElementById(hash);
  if (!el) return;
  if (el.closest('.synapse-settings')) {
    scrollWithin(el, '.synapse-settings');
    return;
  }
  const reduced = documentPrefersReducedMotion();
  el.scrollIntoView({
    block: 'start',
    behavior: reduced ? 'auto' : 'smooth',
  });
}

export function navigateApp(
  path: string,
  hash = '',
  replace = false
): void {
  const next = appHref(path, hash);
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const currentHash = window.location.hash.replace(/^#/, '');
  if (currentPath === path && currentHash === hash) {
    if (hash) scrollToHash(hash);
    return;
  }
  if (replace) window.history.replaceState({}, '', next);
  else window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (hash) {
    window.requestAnimationFrame(() => scrollToHash(hash));
  }
}

export function ensureAppPath(): void {
  const p = window.location.pathname.replace(/\/+$/, '') || '/';
  if (p === '/signin') {
    window.history.replaceState({}, '', APP_PATHS.login);
    return;
  }
  if (isAppPath(p)) return;
  window.history.replaceState({}, '', APP_PATHS.home);
}
