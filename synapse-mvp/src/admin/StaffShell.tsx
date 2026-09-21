import { signOut } from '../auth/client';
import { AppLink, useAppRoute } from '../app/AppLink';
import { APP_PATHS, navigateApp, type AppRoute } from '../app/routes';
import { SynapseWordmark } from '../pages/chrome/SynapseMark';
import { useAuthStore } from '../auth/authStore';
import { roleLabel } from './model';
import { useEffect, useState, type ReactNode } from 'react';

export default function StaffShell<T extends string>({
  title,
  sections,
  children,
}: {
  title: string;
  sections: readonly { id: T; label: string }[];
  children: (section: T) => ReactNode;
}) {
  const route = useAppRoute();
  const role = useAuthStore((s) => s.role);
  const allowed = sections.map((item) => item.id);
  const [section, setSection] = useState<T>(
    () => parseSection(window.location.hash, sections[0]?.id as T, allowed)
  );

  useEffect(() => {
    const ids = sections.map((item) => item.id);
    const onHash = () =>
      setSection(parseSection(window.location.hash, sections[0]?.id as T, ids));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [sections]);

  const dashRoute: AppRoute = route === 'superadmin' ? 'superadmin' : 'admin';

  return (
    <div className="synapse-staff">
      <header className="synapse-staff-top">
        <AppLink to="home" className="synapse-brand-link">
          <SynapseWordmark />
        </AppLink>
        <div>
          <p className="synapse-section-label">{roleLabel(role)}</p>
          <h1 className="synapse-staff-title">{title}</h1>
        </div>
        <nav className="synapse-staff-links" aria-label="Staff">
          {role === 'superadmin' ? (
            <AppLink to="superadmin" className="synapse-mkt-text-link">
              Superadmin
            </AppLink>
          ) : null}
          {role === 'admin' ? (
            <AppLink to="admin" className="synapse-mkt-text-link">
              Admin
            </AppLink>
          ) : null}
          <AppLink to="edit" className="synapse-mkt-text-link">
            Workspace
          </AppLink>
          <AppLink to="profile" className="synapse-mkt-text-link">
            Profile
          </AppLink>
          <button
            type="button"
            className="synapse-btn synapse-btn-danger"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </nav>
      </header>
      <div className="synapse-staff-layout">
        <nav className="synapse-staff-nav" aria-label="Dashboard">
          {sections.map((item) => (
            <a
              key={item.id}
              href={`${APP_PATHS[dashRoute]}#${item.id}`}
              className={`synapse-staff-nav-item${section === item.id ? ' is-active' : ''}`}
              onClick={(event) => {
                event.preventDefault();
                navigateApp(APP_PATHS[dashRoute], item.id);
                setSection(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="synapse-staff-main">{children(section)}</div>
      </div>
    </div>
  );
}

function parseSection<T extends string>(
  hash: string,
  fallback: T,
  allowed: readonly T[]
): T {
  const id = hash.replace(/^#/, '') as T;
  return allowed.includes(id) ? id : fallback;
}
