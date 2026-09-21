import type { MouseEvent, ReactNode } from 'react';
import { APP_PATHS, navigateApp, type AppRoute } from '../app/routes';
import { signOut } from './client';
import { useAuthAccess } from './useAuthAccess';

export default function AuthSwitchLink({
  to,
  children,
  className,
}: {
  to: Extract<AppRoute, 'login' | 'signup'>;
  children: ReactNode;
  className?: string;
}) {
  const { user, complete, workspaceStatus } = useAuthAccess();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const go = () => navigateApp(APP_PATHS[to]);
    if (
      to === 'login' &&
      user &&
      workspaceStatus === 'ready' &&
      !complete
    ) {
      void signOut().finally(go);
      return;
    }
    go();
  };

  return (
    <a href={APP_PATHS[to]} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
