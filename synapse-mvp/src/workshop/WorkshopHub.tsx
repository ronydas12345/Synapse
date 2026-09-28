import { useEffect, useMemo, useState } from 'react';
import { PathLink } from '../app/AppLink';
import { useAuthStore } from '../auth/authStore';
import { APP_PATHS, navigateApp, publicProfilePath } from '../app/routes';
import { listSavedCreators, type PublicCreator } from '../profiles/api';
import { listSavedCreations, listWorkshop } from './api';
import type { WorkshopCard as Card, WorkshopKind, WorkshopTab } from './types';
import TagPicker from './TagPicker';
import WorkshopCard from './WorkshopCard';

const TABS: { id: WorkshopTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'new', label: 'New' },
  { id: 'featured', label: 'Featured' },
  { id: 'search', label: 'Search' },
  { id: 'saved', label: 'Saved' },
];

function tabFromHash(): WorkshopTab {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'new' || hash === 'featured' || hash === 'search' || hash === 'saved') {
    return hash;
  }
  return 'home';
}

export default function WorkshopHub({ preview = false }: { preview?: boolean }) {
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const [tab, setTab] = useState<WorkshopTab>(() => (preview ? 'home' : tabFromHash()));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<WorkshopKind | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [creators, setCreators] = useState<PublicCreator[]>([]);
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
    void (async () => {
      try {
        if (tab === 'saved') {
          if (!signedIn) {
            if (!cancelled) {
              setCards([]);
              setCreators([]);
              setError('');
            }
            return;
          }
          const [savedCards, savedCreators] = await Promise.all([
            listSavedCreations(),
            listSavedCreators(),
          ]);
          if (!cancelled) {
            setCards(savedCards);
            setCreators(savedCreators);
            setError('');
          }
          return;
        }
        const rows = await listWorkshop(tab === 'home' ? 'new' : tab, search, {
          kind,
          tags: tagFilter,
        });
        if (!cancelled) {
          setCards(preview ? rows.slice(0, 6) : rows);
          setCreators([]);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load Workshop.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, search, preview, signedIn, kind, tagFilter]);

  const featured = useMemo(
    () => (tab === 'home' ? cards.filter((card) => card.featured).slice(0, 4) : []),
    [cards, tab]
  );
  const rest =
    tab === 'home' ? cards.filter((card) => !card.featured).slice(0, 12) : cards;

  function chooseTab(next: WorkshopTab) {
    if (next === 'saved' && !signedIn) {
      navigateApp(APP_PATHS.login);
      return;
    }
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
        Public Music Paths and themes live here. Filter by type or tags, then
        like, save, comment, remix, and follow. Unlisted items share with an ID
        or a link. Private drafts stay on your account until you publish.
      </p>
      {preview ? null : (
        <div className="synapse-workshop-tabs" role="tablist" aria-label="Workshop views">
          {TABS.map((item) =>
            item.id === 'saved' && !signedIn ? null : (
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
            )
          )}
          {preview || tab === 'saved' ? null : (
            <select
                className="synapse-settings-input"
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as WorkshopKind | 'all');
                  setTagFilter([]);
                }}
                aria-label="Content type"
              >
                <option value="all">All types</option>
                <option value="playlist">Playlists</option>
                <option value="theme">Themes</option>
              </select>
          )}
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
        <div className="synapse-workshop-filters">
          <label className="synapse-settings-field">
            Search titles, descriptions, usernames, and tags
            <input
              className="synapse-settings-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Workshop"
            />
          </label>
          <label className="synapse-settings-field">
            Content type
            <select
              className="synapse-settings-input"
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as WorkshopKind | 'all');
                setTagFilter([]);
              }}
            >
              <option value="all">Playlists and themes</option>
              <option value="playlist">Playlists</option>
              <option value="theme">Themes</option>
            </select>
          </label>
          {kind === 'all' ? (
            <p className="synapse-settings-lead">
              Choose Playlists or Themes to filter by that catalog’s tags.
            </p>
          ) : (
            <TagPicker
              kind={kind}
              value={tagFilter}
              onChange={setTagFilter}
              label={kind === 'theme' ? 'Theme tags' : 'Playlist tags'}
            />
          )}
        </div>
      ) : null}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {loading ? <p className="synapse-settings-lead">Loading Workshop…</p> : null}
      {!loading && tab === 'saved' && cards.length === 0 && creators.length === 0 ? (
        <p className="synapse-settings-lead">
          Nothing saved yet. Bookmark a public playlist or creator from its page.
        </p>
      ) : null}
      {!loading && tab !== 'saved' && cards.length === 0 ? (
        <p className="synapse-settings-lead">
          {tab === 'search'
            ? 'No matching public creations.'
            : 'No public creations yet. Publish a Music Path or theme from Settings → Workshop.'}
        </p>
      ) : null}
      {tab === 'saved' && creators.length > 0 ? (
        <>
          <h3 className="synapse-workshop-sub">Saved creators</h3>
          <ul className="synapse-saved-creators">
            {creators.map((creator) => (
              <li key={creator.uid}>
                <PathLink href={publicProfilePath(creator.username || creator.shareCode)}>
                  {creator.displayName} @{creator.username}
                </PathLink>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {tab === 'saved' && cards.length > 0 ? (
          <h3 className="synapse-workshop-sub">Saved creations</h3>
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
