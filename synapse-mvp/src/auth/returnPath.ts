import { type AppPath, isListenHref } from '../app/routes';

const KEY = 'synapse_auth_next';
const ALLOWED = new Set<AppPath>([
  '/edit',
  '/listen',
  '/settings',
  '/profile',
  '/admin',
  '/superadmin',
]);

export function isReturnPath(path: string): boolean {
  const p = path.replace(/\/+$/, '') || '/';
  if (ALLOWED.has(p as AppPath)) return true;
  return isListenHref(p);
}

export function rememberReturnPath(path: string): void {
  if (!isReturnPath(path)) return;
  try {
    sessionStorage.setItem(KEY, path.replace(/\/+$/, '') || '/');
  } catch {
    /* private mode */
  }
}

export function consumeReturnPath(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (raw && isReturnPath(raw)) return raw.replace(/\/+$/, '') || '/';
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
