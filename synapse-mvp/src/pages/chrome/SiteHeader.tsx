import { useEffect, useId, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppLink, useAppRoute } from '../../app/AppLink';
import { SynapseWordmark } from './SynapseMark';
import AuthControls from '../../auth/AuthControls';
import { useAuthAccess } from '../../auth/useAuthAccess';
import { useAuthStore } from '../../auth/authStore';
import HomeThemePicker from '../Home/components/HomeThemePicker';
import TutorialHelpButton from '../../tutorial/TutorialHelpButton';
import { CommandPaletteButton } from '../../commandPalette/CommandPalette';
import OpenWorkspaceLink from '../../components/OpenWorkspaceLink';

const NAV = [
  { to: 'home' as const, hash: undefined, section: '', label: 'Home' },
  { to: 'home' as const, hash: 'features', section: 'features', label: 'Features' },
  { to: 'home' as const, hash: 'solutions', section: 'solutions', label: 'Uses' },
  { to: 'home' as const, hash: 'about', section: 'about', label: 'About' },
  { to: 'workshop' as const, hash: undefined, section: 'workshop', label: 'Workshop' },
  { to: 'pricing' as const, hash: undefined, section: 'pricing', label: 'Pricing' },
];

const HOME_SECTIONS = [
  { id: 'hero', nav: '' },
  { id: 'value', nav: '' },
  { id: 'how-it-works', nav: '' },
  { id: 'features', nav: 'features' },
  { id: 'solutions', nav: 'solutions' },
  { id: 'workshop', nav: 'workshop' },
  { id: 'themes', nav: 'themes' },
  { id: 'about', nav: 'about' },
  { id: 'pricing', nav: 'pricing' },
] as const;

function navIsActive(
  item: (typeof NAV)[number],
  route: string,
  section: string
): boolean {
  if (item.to === 'workshop') {
    return (
      route === 'workshop' ||
      route === 'workshopItem' ||
      (route === 'home' && section === 'workshop')
    );
  }
  if (item.to === 'pricing') {
    return route === 'pricing' || (route === 'home' && section === 'pricing');
  }
  if (item.to === 'home' && !item.hash) {
    return route === 'home' && !section;
  }
  return route === 'home' && section === item.section;
}

function useHomeNavSection(route: string): string {
  const [section, setSection] = useState(() =>
    route === 'home' ? window.location.hash.replace(/^#/, '') : ''
  );

  useEffect(() => {
    const syncHash = () => {
      if (route !== 'home') {
        setSection('');
        return;
      }
      setSection(window.location.hash.replace(/^#/, ''));
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  }, [route]);

  useEffect(() => {
    if (route !== 'home') return undefined;

    const update = () => {
      const line = window.innerHeight * 0.28;
      let current = '';
      for (const item of HOME_SECTIONS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = item.nav;
      }
      setSection(current);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [route]);

  return route === 'home' ? section : '';
}

export default function SiteHeader() {
  const route = useAppRoute();
  const section = useHomeNavSection(route);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { complete: signedIn } = useAuthAccess();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  function onNavItem(item: (typeof NAV)[number]) {
    close();
    if (item.to === 'home' && !item.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const staffLinks = (
    <>
      {signedIn && role === 'admin' ? (
        <AppLink to="admin" className="synapse-mkt-staff-link" onNavigate={close}>
          Admin
        </AppLink>
      ) : null}
      {signedIn && role === 'superadmin' ? (
        <AppLink
          to="superadmin"
          className="synapse-mkt-staff-link"
          onNavigate={close}
        >
          Superadmin
        </AppLink>
      ) : null}
    </>
  );

  return (
    <header className={`synapse-mkt-header${solid || open ? ' is-solid' : ''}`}>
      <div className="synapse-mkt-header-inner">
        <AppLink
          to="home"
          className="synapse-mkt-logo"
          onNavigate={() => {
            close();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <SynapseWordmark />
        </AppLink>

        <nav className="synapse-mkt-nav" aria-label="Marketing">
          {NAV.map((item) => {
            const active = navIsActive(item, route, section);
            return (
              <AppLink
                key={item.label}
                to={item.to}
                hash={item.hash}
                className={active ? 'is-active' : undefined}
                aria-current={active ? 'page' : undefined}
                onNavigate={() => onNavItem(item)}
              >
                {item.label}
              </AppLink>
            );
          })}
        </nav>

        <div className="synapse-mkt-header-actions">
          <div className="synapse-mkt-account">
            <TutorialHelpButton />
            {signedIn ? <CommandPaletteButton /> : null}
            <AuthControls onNavigate={close} />
            {staffLinks}
          </div>
          <OpenWorkspaceLink
            className="synapse-btn synapse-btn-play synapse-mkt-cta"
            onNavigate={close}
          />
          <button
            type="button"
            className="synapse-mkt-burger"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div id={menuId} className="synapse-mkt-drawer">
          <nav aria-label="Marketing menu">
            {NAV.map((item) => {
              const active = navIsActive(item, route, section);
              return (
                <AppLink
                  key={item.label}
                  to={item.to}
                  hash={item.hash}
                  className={active ? 'is-active' : undefined}
                  aria-current={active ? 'page' : undefined}
                  onNavigate={() => onNavItem(item)}
                >
                  {item.label}
                </AppLink>
              );
            })}
          </nav>
          <div className="synapse-mkt-drawer-account">
            <p className="synapse-mkt-foot-label">Account</p>
            {route === 'home' ? <HomeThemePicker /> : null}
            <TutorialHelpButton />
            {signedIn ? <CommandPaletteButton /> : null}
            <AuthControls onNavigate={close} />
            {staffLinks}
            <OpenWorkspaceLink className="synapse-btn synapse-btn-play" onNavigate={close} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
