import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../auth/authStore';
import { APP_PATHS, navigateApp } from '../app/routes';
import { listWorkshop } from './api';
import type { WorkshopCard as Card, WorkshopTab } from './types';
import WorkshopCard from './WorkshopCard';

const TABS: { id: WorkshopTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'new', label: 'New' },
  { id: 'featured', label: 'Featured' },
  { id: 'search', label: 'Search' },
];

function tabFromHash(): WorkshopTab {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'new' || hash === 'featured' || hash === 'search') return hash;
  return 'home';
}

export default function WorkshopHub({ preview = false }: { preview?: boolean }) {
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const [tab, setTab] = useState<WorkshopTab>(() => (preview ? 'home' : tabFromHash()));
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preview) return;
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [preview]);

  const search = tab === 'search' ? query : '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listWorkshop(tab === 'home' ? 'new' : tab, search)
      .then((rows) => {
        if (!cancelled) {
          setCards(preview ? rows.slice(0, 6) : rows);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load Workshop.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, search, preview]);

  const featured = useMemo(
    () => (tab === 'home' ? cards.filter((card) => card.featured).slice(0, 4) : []),
    [cards, tab]
  );
  const rest = tab === 'home' ? cards.filter((card) => !card.featured).slice(0, 12) : cards;

  function chooseTab(next: WorkshopTab) {
    setTab(next);
    if (!preview) navigateApp(APP_PATHS.workshop, next === 'home' ? '' : next);
  }

  return (
    <section
      className="synapse-mkt-section"
      id="workshop"
      aria-labelledby="workshop-title"
      data-tutorial="workshop"
    >
      <p className="synapse-mkt-kicker">Workshop</p>
      <h2 id="workshop-title">Build it. Share it. Discover something new.</h2>
      <p className="synapse-mkt-lead">
        Public Music Paths live here. Like, save, remix, and open a creator profile.
        Private drafts stay on your account until you publish.
      </p>
      {preview ? null : (
        <div className="synapse-workshop-tabs" role="tablist" aria-label="Workshop views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`synapse-btn ${tab === item.id ? 'synapse-btn-play' : 'synapse-btn-ghost'}`}
              onClick={() => chooseTab(item.id)}
            >
              {item.label}
            </button>
          ))}
          {signedIn ? (
            <button
              type="button"
              className="synapse-btn synapse-btn-ghost"
              onClick={() => navigateApp(APP_PATHS.settings, 'settings-workshop')}
            >
              Publish
            </button>
          ) : (
            <button
              type="button"
              className="synapse-btn synapse-btn-ghost"
              onClick={() => navigateApp(APP_PATHS.login)}
            >
              Log in to publish
            </button>
          )}
        </div>
      )}
      {tab === 'search' && !preview ? (
        <label className="synapse-settings-field">
          Search titles, descriptions, and usernames
          <input
            className="synapse-settings-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Workshop"
          />
        </label>
      ) : null}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {loading ? <p className="synapse-settings-lead">Loading Workshop…</p> : null}
      {!loading && cards.length === 0 ? (
        <p className="synapse-settings-lead">
          {tab === 'search'
            ? 'No matching public creations.'
            : 'No public creations yet. Publish a Music Path from Settings → Workshop.'}
        </p>
      ) : null}
      {featured.length > 0 ? (
        <>
          <h3 className="synapse-workshop-sub">Featured</h3>
          <div className="synapse-mkt-workshop-row">
            {featured.map((card) => (
              <WorkshopCard key={card.id} card={card} />
            ))}
          </div>
        </>
      ) : null}
      <div className="synapse-mkt-workshop-row">
        {rest.map((card) => (
          <WorkshopCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
