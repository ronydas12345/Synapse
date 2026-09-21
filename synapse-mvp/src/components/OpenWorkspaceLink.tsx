import type { ReactNode } from 'react';
import { AppLink } from '../app/AppLink';
import { APP_PATHS, type AppPath } from '../app/routes';
import { rememberReturnPath } from '../auth/returnPath';
import { useAuthAccess } from '../auth/useAuthAccess';
import { useAppSettings } from '../settings/settingsStore';

export function defaultWorkspacePath(): AppPath {
  const general = useAppSettings.getState().general;
  const mode = general.rememberLastWorkspace
    ? general.lastWorkspace
    : general.startupWorkspace;
  return mode === 'listen' ? APP_PATHS.listen : APP_PATHS.edit;
}

export default function OpenWorkspaceLink({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const { user, complete } = useAuthAccess();
  const remember = useAppSettings((s) => s.general.rememberLastWorkspace);
  const last = useAppSettings((s) => s.general.lastWorkspace);
  const startup = useAppSettings((s) => s.general.startupWorkspace);
  const workspace = remember ? last : startup;
  const workspacePath =
    workspace === 'listen' ? APP_PATHS.listen : APP_PATHS.edit;
  const signedIn = Boolean(user && complete);
  const to = signedIn ? workspace : 'login';

  return (
    <AppLink
      to={to}
      className={className}
      onNavigate={() => {
        if (!signedIn) rememberReturnPath(workspacePath);
        onNavigate?.();
      }}
    >
      {children}
    </AppLink>
  );
}
