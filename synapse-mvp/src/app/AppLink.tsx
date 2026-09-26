import { useEffect, useState, type ReactNode } from 'react';
import {
  APP_PATHS,
  appHref,
  ensureAppPath,
  navigateApp,
  parseAppLocation,
  type AppLocation,
  type AppRoute,
  type StaticAppRoute,
} from './routes';

export function useAppLocation(): AppLocation {
  const [location, setLocation] = useState<AppLocation>(() => {
    ensureAppPath();
    return parseAppLocation(window.location.pathname);
  });

  useEffect(() => {
    const sync = () => {
      ensureAppPath();
      setLocation(parseAppLocation(window.location.pathname));
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return location;
}

export function useAppRoute(): AppRoute {
  return useAppLocation().route;
}

function clickNavigates(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function AppLink({
  to,
  hash,
  children,
  className,
  title,
  onNavigate,
}: {
  to: StaticAppRoute;
  hash?: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onNavigate?: () => void;
}) {
  const href = appHref(APP_PATHS[to], hash);
  return (
    <a
      href={href}
      className={className}
      title={title}
      onClick={(event) => {
        if (!clickNavigates(event)) return;
        event.preventDefault();
        navigateApp(APP_PATHS[to], hash);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

export function PathLink({
  href,
  children,
  className,
  title,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={href}
      className={className}
      title={title}
      onClick={(event) => {
        if (!clickNavigates(event)) return;
        event.preventDefault();
        const [path, hash] = href.split('#');
        navigateApp(path || '/', hash || '');
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}
