import { useEffect, useState } from 'react';
import { APP_PATHS, navigateApp, publicProfilePath } from '../app/routes';
import { useAuthStore } from '../auth/authStore';
import BadgeStrip from '../badges/BadgeStrip';
import { listEarnedBadges, type EarnedBadge } from '../badges/api';
import { nameplateClass } from '../decorations/catalog';
import DecorationFrame from '../decorations/DecorationFrame';
import ProfileRecognition from '../profile/ProfileRecognition';
import { useProfileStore } from '../profile/profileStore';
import SharePanel from '../share/SharePanel';
import { usePathStore } from '../store';
import {
  followCreator,
  isCreatorSaved,
  isFollowing,
  readPublicCreator,
  toggleCreatorSave,
  unfollowCreator,
  type PublicCreator,
} from './api';
import ProfileDetailsReadout from './ProfileDetailsReadout';
import ProfileNavLinks from './ProfileNavLinks';
import ProfileVisibilityField from './ProfileVisibilityField';
import {
  readCreatorProfileDetails,
  type CreatorProfileDetails,
} from './profileDetails';
import { listCreatorWorkshop } from '../workshop/api';
import WorkshopCard from '../workshop/WorkshopCard';
import type { WorkshopCard as Card } from '../workshop/types';

export default function PublicProfilePage({ username }: { username: string }) {
  const user = useAuthStore((s) => s.user);
  const ownUsername = useProfileStore((s) => s.profile.username);
  const setVisibility = useProfileStore((s) => s.setVisibility);
  const storeProfile = useProfileStore((s) => s.profile);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const [creator, setCreator] = useState<PublicCreator | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [details, setDetails] = useState<CreatorProfileDetails | null>(null);
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
        setDetails(null);
        if (!next) {
          setError('This profile is private or does not exist.');
          return;
        }
        const [earned, workshop, extras] = await Promise.all([
          listEarnedBadges(next.uid),
          listCreatorWorkshop(next.uid),
          readCreatorProfileDetails(username).catch(() => null),
        ]);
        if (cancelled) return;
        setBadges(earned);
        setCards(workshop);
        setDetails(extras);
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
  const detailsProfile = own
    ? {
        ...storeProfile,
        bio: storeProfile.bio || creator.bio,
      }
    : details
      ? {
          ...details.profile,
          bio: details.profile.bio || creator.bio,
        }
      : null;
  const playlists = own
    ? (storeProfile.visibility === 'public'
        ? pathSummaries.filter((path) => path.visibility === 'public')
        : pathSummaries
      ).map((path) => ({
        id: path.id,
        name: path.name,
        visibility: path.visibility,
      }))
    : details?.playlists ?? [];

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-public-profile">
      <div
        className="synapse-public-profile-hero"
        data-deco={creator.equippedDecoration || 'default'}
      >
        <DecorationFrame id={creator.equippedDecoration}>
          {creator.photoUrl ? (
            <img src={creator.photoUrl} alt="" width={72} height={72} />
          ) : (
            <span aria-hidden="true">@</span>
          )}
        </DecorationFrame>
        <div className="synapse-profile-hero-copy">
          <h1 className={nameplateClass(creator.equippedDecoration)}>
            {creator.displayName}
          </h1>
          <p className="synapse-profile-handle">@{creator.username}</p>
          {own ? (
            <ProfileNavLinks
              here="public"
              username={ownUsername || creator.username}
            />
          ) : null}
          <p className="synapse-settings-lead">
            {creator.followerCount} follower{creator.followerCount === 1 ? '' : 's'}
            {creator.visibility === 'unlisted' ? ' · unlisted' : ''}
          </p>
          <BadgeStrip badges={badges} featuredId={creator.featuredBadge} compact />
        </div>
      </div>
      {!detailsProfile && creator.bio ? (
        <p className="synapse-mkt-lead">{creator.bio}</p>
      ) : null}
      {!own ? (
      <div className="synapse-workshop-actions">
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
      </div>
      ) : null}
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
      {own ? (
        <section className="synapse-profile-section">
          <h2>Profile settings</h2>
          <ProfileVisibilityField
            value={storeProfile.visibility}
            onChange={setVisibility}
          />
          <ProfileRecognition
            editing
            onEquippedChange={(id) => {
              setCreator((current) =>
                current ? { ...current, equippedDecoration: id } : current
              );
            }}
            onRecognition={(next) => {
              setCreator((current) => {
                if (!current) return current;
                return {
                  ...current,
                  equippedDecoration: next.equipped ?? current.equippedDecoration,
                  featuredBadge:
                    next.featured !== undefined ? next.featured : current.featuredBadge,
                };
              });
            }}
          />
        </section>
      ) : null}
      <section>
        <h2>Badges</h2>
        <BadgeStrip badges={badges} featuredId={creator.featuredBadge} />
      </section>
      {detailsProfile ? (
        <ProfileDetailsReadout
          profile={detailsProfile}
          playlists={playlists}
          showSaved={own}
          showEmpty={own}
        />
      ) : null}
      <section>
        <h2>Workshop</h2>
        {cards.length === 0 ? (
          <p className="synapse-settings-lead">No public creations yet.</p>
        ) : (
          <div className="synapse-mkt-workshop-row">
            {cards.map((card) => (
              <WorkshopCard key={card.id} card={card} author={creator} featuredBadge={creator.featuredBadge} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
