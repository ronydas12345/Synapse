import {
  APP_PATHS,
  isProtectedRoute,
  type AppPath,
  type AppRoute,
} from '../app/routes';

/** Incomplete accounts must finish names before the workspace, not before Log in. */
export function incompleteUserRedirect(route: AppRoute): AppPath | null {
  if (isProtectedRoute(route)) return APP_PATHS.signup;
  return null;
}

/** Wait for cloud hydrate so a reload does not look signed out. */
export function shouldDeferIncompleteRedirect(
  workspaceStatus: 'idle' | 'loading' | 'ready'
): boolean {
  return workspaceStatus !== 'ready';
}
