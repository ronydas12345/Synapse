import { APP_PATHS, isAuthRoute, isProtectedRoute, navigateApp } from '../app/routes';
import { rememberReturnPath } from './returnPath';
import { goToAppAfterAuth } from './goToAppAfterAuth';
import { useAuthAccess } from './useAuthAccess';
import { useAppRoute } from '../app/AppLink';
import AuthGate from './AuthGate';
import SuspendedPage from '../pages/SuspendedPage';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './authStore';
import { canOpenAdmin, canOpenSuperadmin } from '../admin/permissions';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const route = useAppRoute();
  const { status, user, complete } = useAuthAccess();
  const role = useAuthStore((s) => s.role);
  const roleStatus = useAuthStore((s) => s.roleStatus);
  const accountStatus = useAuthStore((s) => s.accountStatus);

  useEffect(() => {
    if (status !== 'ready') return;
    if (!user) {
      if (isProtectedRoute(route)) {
        rememberReturnPath(APP_PATHS[route]);
        navigateApp(APP_PATHS.login, '', true);
      }
      return;
    }
    if (!complete) {
      if (isProtectedRoute(route) || route === 'login') {
        navigateApp(APP_PATHS.signup, '', true);
      }
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
  }, [status, user, complete, route, role, roleStatus, accountStatus]);

  if (isProtectedRoute(route) && (status !== 'ready' || !user || !complete)) {
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
