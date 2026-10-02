import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../auth/authStore';
import { APP_PATHS, navigateApp } from '../app/routes';
import { listSavedCreators, listPublicCreators, readPublicCreatorsByUids, type PublicCreator } from '../profiles/api';
import { listSavedCreations, listWorkshop } from './api';
import {
  WORKSHOP_BROWSE_OPTIONS,
  type WorkshopBrowseKind,
  type WorkshopCard as Card,
  type WorkshopTab,
} from './types';
import CreatorCard from './CreatorCard';
import TagPicker from './TagPicker';
import WorkshopCard from './WorkshopCard';

const TABS: { id: WorkshopTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'new', label: 'New' },
  { id: 'featured', label: 'Featured' },
  { id: 'search', label: 'Search' },
  { id: 'saved', label: 'Saved' },
];

async function authorsFor(cards: Card[], known: PublicCreator[]): Promise<PublicCreator[]> {
  const byUid = new Map(known.map((creator) => [creator.uid, creator]));
  const missing = cards.map((card) => card.creatorUid).filter((uid) => uid && !byUid.has(uid));
  if (missing.length === 0) return [...byUid.values()];
  const extra = await readPublicCreatorsByUids(missing);
  for (const creator of extra) byUid.set(creator.uid, creator);
  return [...byUid.values()];
}

function authorFor(authors: PublicCreator[], card: Card): PublicCreator | null {
  return (
    authors.find((creator) => creator.uid === card.creatorUid) ||
    authors.find(
      (creator) =>
        creator.username &&
        card.creatorUsername &&
        creator.username.toLowerCase() === card.creatorUsername.toLowerCase()
    ) ||
    null
  );
}

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
  const [kind, setKind] = useState<WorkshopBrowseKind>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [creators, setCreators] = useState<PublicCreator[]>([]);
  const [authors, setAuthors] = useState<PublicCreator[]>([]);
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
          const savedAuthors = await authorsFor(savedCards, savedCreators);
          if (!cancelled) {
            setCards(savedCards);
            setCreators(savedCreators);
            setAuthors(savedAuthors);
            setError('');
          }
          return;
        }
        if (kind === 'user') {
          const rows = await listPublicCreators(
            search,
            tab === 'new' ? 'new' : 'followers'
          );
          if (!cancelled) {
            setCards([]);
            setCreators(preview ? rows.slice(0, 6) : rows);
            setAuthors([]);
            setError('');
          }
          return;
        }
        const rows = await listWorkshop(tab === 'home' ? 'new' : tab, search, {
          kind: kind === 'all' ? 'all' : kind,
          tags: tagFilter,
        });
        let userRows: PublicCreator[] = [];
        if (kind === 'all') {
          try {
            userRows = await listPublicCreators(
              search,
              tab === 'new' ? 'new' : 'followers'
            );
          } catch (err) {
            console.error('Could not load public profiles', err);
          }
        }
        const shownCards = preview ? rows.slice(0, 6) : rows;
        const shownCreators = preview ? userRows.slice(0, 6) : userRows;
        const shownAuthors = await authorsFor(shownCards, shownCreators);
        if (!cancelled) {
          setCards(shownCards);
          setCreators(shownCreators);
          setAuthors(shownAuthors);
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
        Public Music Paths, themes, and users live here. Filter by type or tags,
        then like, save, comment, remix, and follow. Unlisted items share with an
        ID or a link. Private drafts stay on your account until you publish.
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
                  setKind(event.target.value as WorkshopBrowseKind);
                  setTagFilter([]);
                }}
                aria-label="Content type"
              >
                {WORKSHOP_BROWSE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
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
                setKind(event.target.value as WorkshopBrowseKind);
                setTagFilter([]);
              }}
            >
              {WORKSHOP_BROWSE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {kind === 'playlist' || kind === 'theme' ? (
            <TagPicker
              kind={kind}
              value={tagFilter}
              onChange={setTagFilter}
              label={kind === 'theme' ? 'Theme tags' : 'Playlist tags'}
            />
          ) : (
            <p className="synapse-settings-lead">
              {kind === 'user'
                ? 'Users lists public profiles by name and username.'
                : 'Choose Playlists or Themes to filter by that catalog’s tags.'}
            </p>
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
      {!loading && tab !== 'saved' && kind === 'user' && creators.length === 0 ? (
        <p className="synapse-settings-lead">
          {tab === 'search'
            ? 'No matching public profiles.'
            : 'No public profiles yet. Set a profile to public from Profile settings.'}
        </p>
      ) : null}
      {!loading &&
      tab !== 'saved' &&
      kind !== 'user' &&
      cards.length === 0 &&
      (kind !== 'all' || creators.length === 0) ? (
        <p className="synapse-settings-lead">
          {tab === 'search'
            ? 'No matching public creations.'
            : 'No public creations yet. Publish a Music Path or theme from Settings → Workshop.'}
        </p>
      ) : null}
      {tab === 'saved' && creators.length > 0 ? (
        <>
          <h3 className="synapse-workshop-sub">Saved creators</h3>
          <div className="synapse-mkt-workshop-row">
            {creators.map((creator) => (
              <CreatorCard key={creator.uid} creator={creator} />
            ))}
          </div>
        </>
      ) : null}
      {tab !== 'saved' && (kind === 'user' || kind === 'all') && creators.length > 0 ? (
        <>
          {kind === 'all' ? <h3 className="synapse-workshop-sub">Users</h3> : null}
          <div className="synapse-mkt-workshop-row">
            {creators.map((creator) => (
              <CreatorCard key={creator.uid} creator={creator} />
            ))}
          </div>
        </>
      ) : null}
      {tab === 'saved' && cards.length > 0 ? (
          <h3 className="synapse-workshop-sub">Saved creations</h3>
      ) : null}
      {kind !== 'user' && featured.length > 0 ? (
        <>
          <h3 className="synapse-workshop-sub">Featured</h3>
          <div className="synapse-mkt-workshop-row">
            {featured.map((card) => (
              <WorkshopCard key={card.id} card={card} author={authorFor(authors, card)} />
            ))}
          </div>
        </>
      ) : null}
      {kind !== 'user' ? (
      <div className="synapse-mkt-workshop-row">
        {rest.map((card) => (
          <WorkshopCard key={card.id} card={card} author={authorFor(authors, card)} />
        ))}
      </div>
      ) : null}
    </section>
  );
}
