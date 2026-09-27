import { useEffect, useState } from 'react';
import { APP_PATHS, navigateApp, publicProfilePath } from '../app/routes';
import { useAuthStore } from '../auth/authStore';
import BadgeStrip from '../badges/BadgeStrip';
import { listEarnedBadges, type EarnedBadge } from '../badges/api';
import { decorationClass } from '../decorations/catalog';
import SharePanel from '../share/SharePanel';
import {
  followCreator,
  isCreatorSaved,
  isFollowing,
  readPublicCreator,
  toggleCreatorSave,
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
  const [bookmarked, setBookmarked] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

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
          const [follows, saved] = await Promise.all([
            isFollowing(next.uid, user.uid),
            isCreatorSaved(next.uid, user.uid),
          ]);
          if (cancelled) return;
          setFollowing(follows);
          setBookmarked(saved);
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
  const sharePath = publicProfilePath(creator.username || creator.shareCode);

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
            {creator.visibility === 'unlisted' ? ' · unlisted' : ''}
          </p>
        </div>
      </div>
      {creator.bio ? <p className="synapse-mkt-lead">{creator.bio}</p> : null}
      <div className="synapse-workshop-actions">
        {own ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => navigateApp(APP_PATHS.profile)}
          >
            Edit profile
          </button>
        ) : (
          <>
            {creator.followsEnabled ? (
              <button
                type="button"
                className="synapse-btn synapse-btn-play"
                disabled={Boolean(busy)}
                onClick={() => {
                  if (!user) {
                    navigateApp(APP_PATHS.login);
                    return;
                  }
                  setBusy('follow');
                  const action = following
                    ? unfollowCreator(creator.uid)
                    : followCreator(creator.uid);
                  void action
                    .then(() => setFollowing(!following))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Follow failed.')
                    )
                    .finally(() => setBusy(''));
                }}
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>
            ) : (
              <p className="synapse-settings-hint">This creator is not accepting followers.</p>
            )}
            {creator.savesEnabled ? (
              <button
                type="button"
                className="synapse-btn synapse-btn-ghost"
                disabled={Boolean(busy)}
                onClick={() => {
                  if (!user) {
                    navigateApp(APP_PATHS.login);
                    return;
                  }
                  setBusy('save');
                  void toggleCreatorSave(creator.uid)
                    .then((on) => setBookmarked(on))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Could not save this creator.')
                    )
                    .finally(() => setBusy(''));
                }}
              >
                {bookmarked ? 'Saved' : 'Save creator'}
              </button>
            ) : null}
          </>
        )}
      </div>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {(creator.visibility === 'public' ||
        creator.visibility === 'unlisted' ||
        own) ? (
        <SharePanel
          shareCode={creator.shareCode || creator.username}
          path={sharePath}
          label="profile"
        />
      ) : null}
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
    </main>
  );
}
