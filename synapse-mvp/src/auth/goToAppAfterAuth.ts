import { navigateApp, type AppPath } from '../app/routes';
import { consumeReturnPath } from './returnPath';
import { defaultWorkspacePath } from '../components/OpenWorkspaceLink';
import { useAuthStore } from './authStore';
import { canOpenPath, dashboardPathForRole } from '../admin/permissions';

export function goToAppAfterAuth(): void {
  const role = useAuthStore.getState().role;
  const next = consumeReturnPath();
  if (next && canOpenPath(next, role)) {
    navigateApp(next, '', true);
    return;
  }
  const dest: AppPath =
    role === 'user' ? defaultWorkspacePath() : dashboardPathForRole(role);
  navigateApp(dest, '', true);
}
