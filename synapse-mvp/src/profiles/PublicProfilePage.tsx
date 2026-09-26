import { useEffect, useState } from 'react';
import { APP_PATHS, navigateApp, publicProfilePath } from '../app/routes';
import { PathLink } from '../app/AppLink';
import { useAuthStore } from '../auth/authStore';
import BadgeStrip from '../badges/BadgeStrip';
import { listEarnedBadges, type EarnedBadge } from '../badges/api';
import { decorationClass } from '../decorations/catalog';
import {
  followCreator,
  isFollowing,
  readPublicCreator,
  unfollowCreator,
  type PublicCreator,
} from './api';
import { listCreatorWorkshop } from '../workshop/api';
import WorkshopCard from '../workshop/WorkshopCard';
import type { WorkshopCard as Card } from '../workshop/types';

export default function PublicProfilePage({ username }: { username: string }) {
  const user = useAuthStore((s) => s.user);
  const [creator, setCreator] = useState<PublicCreator | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await readPublicCreator(username);
        if (cancelled) return;
        setCreator(next);
        if (!next) {
          setError('This profile is private or does not exist.');
          return;
        }
        const [earned, workshop] = await Promise.all([
          listEarnedBadges(next.uid),
          listCreatorWorkshop(next.uid),
        ]);
        if (cancelled) return;
        setBadges(earned);
        setCards(workshop);
        if (user && user.uid !== next.uid) {
          setFollowing(await isFollowing(next.uid, user.uid));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load profile.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, user]);

  if (!creator) {
    return (
      <main id="main" className="synapse-mkt-main synapse-mkt-page">
        <p className="synapse-settings-lead">{error || 'Loading…'}</p>
      </main>
    );
  }

  const own = user?.uid === creator.uid;

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-public-profile">
      <div className="synapse-public-profile-hero">
        <span className={decorationClass(creator.equippedDecoration)}>
          {creator.photoUrl ? (
            <img src={creator.photoUrl} alt="" width={72} height={72} />
          ) : (
            <span aria-hidden="true">@</span>
          )}
        </span>
        <div>
          <h1>{creator.displayName}</h1>
          <p className="synapse-profile-handle">@{creator.username}</p>
          <p className="synapse-settings-lead">
            {creator.followerCount} follower{creator.followerCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      {creator.bio ? <p className="synapse-mkt-lead">{creator.bio}</p> : null}
      {own ? (
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => navigateApp(APP_PATHS.profile)}
        >
          Edit profile
        </button>
      ) : (
        <button
          type="button"
          className="synapse-btn synapse-btn-play"
          disabled={busy}
          onClick={() => {
            if (!user) {
              navigateApp(APP_PATHS.login);
              return;
            }
            setBusy(true);
            const action = following
              ? unfollowCreator(creator.uid)
              : followCreator(creator.uid);
            void action
              .then(() => setFollowing(!following))
              .catch((err) => setError(err instanceof Error ? err.message : 'Follow failed.'))
              .finally(() => setBusy(false));
          }}
        >
          {following ? 'Unfollow' : 'Follow'}
        </button>
      )}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <section>
        <h2>Badges</h2>
        <BadgeStrip badges={badges} featuredId={creator.featuredBadge} />
      </section>
      <section>
        <h2>Workshop</h2>
        {cards.length === 0 ? (
          <p className="synapse-settings-lead">No public creations yet.</p>
        ) : (
          <div className="synapse-mkt-workshop-row">
            {cards.map((card) => (
              <WorkshopCard key={card.id} card={card} featuredBadge={creator.featuredBadge} />
            ))}
          </div>
        )}
      </section>
      <p className="synapse-settings-hint">
        Public profile URL:{' '}
        <PathLink href={publicProfilePath(creator.username)}>
          /u/{creator.username}
        </PathLink>
      </p>
    </main>
  );
}
