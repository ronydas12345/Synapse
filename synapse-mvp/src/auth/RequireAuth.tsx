import { APP_PATHS, isAuthRoute, isListenHref, isProtectedRoute, navigateApp } from '../app/routes';
import { rememberReturnPath } from './returnPath';
import { goToAppAfterAuth } from './goToAppAfterAuth';
import {
  incompleteUserRedirect,
  shouldDeferIncompleteRedirect,
} from './authRedirect';
import { useAuthAccess } from './useAuthAccess';
import { useAppLocation } from '../app/AppLink';
import AuthGate from './AuthGate';
import SuspendedPage from '../pages/SuspendedPage';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './authStore';
import { canOpenAdmin, canOpenSuperadmin } from '../admin/permissions';
import { hasWorkshopGuestSession } from '../workshop/guestSession';
import { usePathStore } from '../store';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useAppLocation();
  const route = location.route;
  const { status, user, complete, workspaceStatus } = useAuthAccess();
  const role = useAuthStore((s) => s.role);
  const roleStatus = useAuthStore((s) => s.roleStatus);
  const accountStatus = useAuthStore((s) => s.accountStatus);
  const graphLocked = usePathStore((s) => s.graphLocked);
  const workshopPreview =
    (route === 'listen' || route === 'edit') &&
    (hasWorkshopGuestSession() ||
      graphLocked ||
      (route === 'listen' && Boolean(location.workshopId)));

  useEffect(() => {
    if (status !== 'ready') return;
    if (!user) {
      if (isProtectedRoute(route) && !workshopPreview) {
        const here = window.location.pathname.replace(/\/+$/, '') || '/';
        rememberReturnPath(isListenHref(here) ? here : APP_PATHS[route]);
        navigateApp(APP_PATHS.login, '', true);
      }
      return;
    }
    if (shouldDeferIncompleteRedirect(workspaceStatus)) return;
    if (!complete) {
      if (workshopPreview) return;
      const next = incompleteUserRedirect(route);
      if (next) navigateApp(next, '', true);
      return;
    }
    if (accountStatus === 'suspended') return;
    if (roleStatus !== 'ready') return;
    if (route === 'superadmin' && !canOpenSuperadmin(role)) {
      navigateApp(canOpenAdmin(role) ? APP_PATHS.admin : APP_PATHS.edit, '', true);
      return;
    }
    if (route === 'admin' && !canOpenAdmin(role)) {
      navigateApp(
        canOpenSuperadmin(role) ? APP_PATHS.superadmin : APP_PATHS.edit,
        '',
        true
      );
      return;
    }
    if (isAuthRoute(route)) goToAppAfterAuth();
  }, [
    status,
    user,
    complete,
    workspaceStatus,
    route,
    role,
    roleStatus,
    accountStatus,
    workshopPreview,
  ]);

  if (
    isProtectedRoute(route) &&
    !workshopPreview &&
    (status !== 'ready' || !user || !complete || workspaceStatus !== 'ready')
  ) {
    return <AuthGate />;
  }

  if (isAuthRoute(route) && user && workspaceStatus !== 'ready') {
    return <AuthGate />;
  }

  if (isAuthRoute(route) && status === 'ready' && user && complete && roleStatus !== 'ready') {
    return <AuthGate />;
  }

  if (isAuthRoute(route) && status === 'ready' && user && complete) {
    return <AuthGate />;
  }

  if (user && complete && accountStatus === 'suspended' && isProtectedRoute(route)) {
    return <SuspendedPage />;
  }

  if (route === 'admin' && (roleStatus !== 'ready' || !canOpenAdmin(role))) {
    return <AuthGate />;
  }

  if (route === 'superadmin' && (roleStatus !== 'ready' || !canOpenSuperadmin(role))) {
    return <AuthGate />;
  }

  return children;
}
