import type { AppPath } from '../app/routes';

const KEY = 'synapse_auth_next';
const ALLOWED = new Set<AppPath>([
  '/edit',
  '/listen',
  '/settings',
  '/profile',
  '/admin',
  '/superadmin',
]);

export function isReturnPath(path: string): path is AppPath {
  const p = path.replace(/\/+$/, '') || '/';
  return ALLOWED.has(p as AppPath);
}

export function rememberReturnPath(path: string): void {
  if (!isReturnPath(path)) return;
  try {
    sessionStorage.setItem(KEY, path.replace(/\/+$/, '') || '/');
  } catch {
    /* private mode */
  }
}

export function consumeReturnPath(): AppPath | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (raw && isReturnPath(raw)) return raw.replace(/\/+$/, '') as AppPath;
  } catch {
    /* private mode */
  }
  return null;
}

export function clearReturnPath(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
