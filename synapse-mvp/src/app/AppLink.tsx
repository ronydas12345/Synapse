import { useEffect, useState, type ReactNode } from 'react';
import {
  APP_PATHS,
  appHref,
  ensureAppPath,
  navigateApp,
  pathToRoute,
  type AppRoute,
} from './routes';

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => {
    ensureAppPath();
    return pathToRoute(window.location.pathname);
  });

  useEffect(() => {
    ensureAppPath();
    setRoute(pathToRoute(window.location.pathname));
    const onPop = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return route;
}

export function AppLink({
  to,
  hash,
  children,
  className,
  title,
  onNavigate,
}: {
  to: AppRoute;
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
        navigateApp(APP_PATHS[to], hash);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}
