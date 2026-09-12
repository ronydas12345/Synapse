import type { ReactNode } from 'react';
import { AppLink } from '../app/AppLink';
import { useAppSettings } from '../settings/settingsStore';

export default function OpenWorkspaceLink({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const remember = useAppSettings((s) => s.general.rememberLastWorkspace);
  const last = useAppSettings((s) => s.general.lastWorkspace);
  const startup = useAppSettings((s) => s.general.startupWorkspace);
  const to = remember ? last : startup;
  return (
    <AppLink to={to} className={className} onNavigate={onNavigate}>
      {children}
    </AppLink>
  );
}
