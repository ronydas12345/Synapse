export type AppRoute =
  | 'home'
  | 'workshop'
  | 'pricing'
  | 'changelog'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'edit'
  | 'listen'
  | 'settings'
  | 'profile';

export type AppPath =
  | '/'
  | '/workshop'
  | '/pricing'
  | '/changelog'
  | '/faq'
  | '/privacy'
  | '/terms'
  | '/cookies'
  | '/edit'
  | '/listen'
  | '/settings'
  | '/profile';

export const APP_PATHS: Record<AppRoute, AppPath> = {
  home: '/',
  workshop: '/workshop',
  pricing: '/pricing',
  changelog: '/changelog',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  edit: '/edit',
  listen: '/listen',
  settings: '/settings',
  profile: '/profile',
};

const PATH_SET = new Set<string>(Object.values(APP_PATHS));

const MARKETING: ReadonlySet<AppRoute> = new Set([
  'home',
  'workshop',
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
  return !isMarketingRoute(route);
}

export function pathToRoute(pathname: string): AppRoute {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return 'home';
  if (p === '/workshop') return 'workshop';
  if (p === '/pricing') return 'pricing';
  if (p === '/changelog') return 'changelog';
  if (p === '/faq') return 'faq';
  if (p === '/privacy') return 'privacy';
  if (p === '/terms') return 'terms';
  if (p === '/cookies') return 'cookies';
  if (p === '/edit') return 'edit';
  if (p === '/listen') return 'listen';
  if (p === '/settings') return 'settings';
  if (p === '/profile') return 'profile';
  return 'home';
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
  return PATH_SET.has(p);
}

export function appHref(path: AppPath, hash = ''): string {
  if (!hash) return path;
  return `${path}#${hash}`;
}

function scrollToHash(hash: string): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(hash)?.scrollIntoView({
    block: 'start',
    behavior: reduced ? 'auto' : 'smooth',
  });
}

export function navigateApp(path: AppPath, hash = ''): void {
  const next = appHref(path, hash);
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const currentHash = window.location.hash.replace(/^#/, '');
  if (currentPath === path && currentHash === hash) {
    if (hash) scrollToHash(hash);
    return;
  }
  window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (hash) {
    window.requestAnimationFrame(() => scrollToHash(hash));
  }
}

export function ensureAppPath(): void {
  const p = window.location.pathname.replace(/\/+$/, '') || '/';
  if (PATH_SET.has(p)) return;
  window.history.replaceState({}, '', APP_PATHS.home);
}
