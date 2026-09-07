import { useEffect, useId, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppLink, useAppRoute } from '../../app/AppLink';
import SynapseMark from './SynapseMark';
import { useProfileStore } from '../../profile/profileStore';

const NAV = [
  { to: 'home' as const, label: 'Home' },
  { to: 'home' as const, hash: 'features', label: 'Features' },
  { to: 'home' as const, hash: 'solutions', label: 'Solutions' },
  { to: 'home' as const, hash: 'about', label: 'About' },
  { to: 'workshop' as const, label: 'Workshop' },
  { to: 'pricing' as const, label: 'Pricing' },
];

export default function SiteHeader() {
  const route = useAppRoute();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const username = useProfileStore((s) => s.profile.username);

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

  return (
    <header className={`synapse-mkt-header${solid || open ? ' is-solid' : ''}`}>
      <div className="synapse-mkt-header-inner">
        <AppLink to="home" className="synapse-mkt-logo" onNavigate={close}>
          <SynapseMark size={32} />
          <span className="synapse-brand">Synapse</span>
        </AppLink>

        <nav className="synapse-mkt-nav" aria-label="Marketing">
          {NAV.map((item) => (
            <AppLink
              key={item.label}
              to={item.to}
              hash={item.hash}
              className={
                !item.hash && route === item.to ? 'is-active' : undefined
              }
            >
              {item.label}
            </AppLink>
          ))}
        </nav>

        <div className="synapse-mkt-header-actions">
          <AppLink to="profile" className="synapse-mkt-text-link" onNavigate={close}>
            {username ? 'Profile' : 'Log In'}
          </AppLink>
          <AppLink
            to="edit"
            className="synapse-btn synapse-btn-play synapse-mkt-cta"
            onNavigate={close}
          >
            Open Synapse
          </AppLink>
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
            {NAV.map((item) => (
              <AppLink
                key={item.label}
                to={item.to}
                hash={item.hash}
                onNavigate={close}
              >
                {item.label}
              </AppLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
