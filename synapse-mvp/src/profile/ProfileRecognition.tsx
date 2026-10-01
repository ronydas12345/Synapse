import { useEffect, useState } from 'react';
import { PathLink } from '../app/AppLink';
import { publicProfilePath } from '../app/routes';
import BadgeStrip from '../badges/BadgeStrip';
import {
  evaluateOwnProgress,
  listEarnedBadges,
  setFeaturedBadge,
  type EarnedBadge,
} from '../badges/api';
import DecorationPicker from '../decorations/DecorationPicker';
import { equipDecoration, listUnlockedDecorations } from '../decorations/api';
import { readOwnCreator, setProfileSocial } from '../profiles/api';
import { useAuthStore } from '../auth/authStore';
import { useProfileStore } from '../profile/profileStore';
import SharePanel from '../share/SharePanel';

export default function ProfileRecognition({
  editing,
  onEquippedChange,
}: {
  editing: boolean;
  onEquippedChange?: (id: string) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const username = useProfileStore((s) => s.profile.username);
  const visibility = useProfileStore((s) => s.profile.visibility);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>(['default']);
  const [equipped, setEquipped] = useState('default');
  const [featured, setFeatured] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [followsEnabled, setFollowsEnabled] = useState(true);
  const [savesEnabled, setSavesEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        try {
          await evaluateOwnProgress();
        } catch {
          /* Badges already on the account still load. */
        }
        const [earned, deco, creator] = await Promise.all([
          listEarnedBadges(user.uid),
          listUnlockedDecorations(user.uid),
          readOwnCreator(user.uid),
        ]);
        if (cancelled) return;
        setBadges(earned);
        setUnlocked(deco.length ? deco : ['default']);
        const nextEquipped = creator?.equippedDecoration || 'default';
        setEquipped(nextEquipped);
        onEquippedChange?.(nextEquipped);
        setFeatured(creator?.featuredBadge || '');
        setShareCode(creator?.shareCode || '');
        setFollowsEnabled(creator?.followsEnabled !== false);
        setSavesEnabled(creator?.savesEnabled !== false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load badges.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, onEquippedChange]);

  if (!user) return null;

  const sharePath = username ? publicProfilePath(username) : shareCode ? publicProfilePath(shareCode) : '';

  function saveSocial(next: { followsEnabled: boolean; savesEnabled: boolean }) {
    setFollowsEnabled(next.followsEnabled);
    setSavesEnabled(next.savesEnabled);
    void setProfileSocial(next).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not save social settings.');
    });
  }

  function saveFeatured(id: string) {
    setFeatured(id);
    void setFeaturedBadge(id).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not save badge.');
    });
  }

  return (
    <section className="synapse-profile-section">
      <h2>Badges and decorations</h2>
      <p className="synapse-settings-lead">
        Badges are awarded on the server for account age, Workshop publishes,
        followers, and staff roles. Decorations are cosmetic frames.
      </p>
      {username ? (
        <p className="synapse-settings-hint">
          Public page:{' '}
          <PathLink href={publicProfilePath(username)}>/u/{username}</PathLink>
          {visibility === 'public'
            ? ' (listed while the profile is public)'
            : visibility === 'unlisted'
              ? ' (unlisted — share the ID or link)'
              : ' (visible after you set the profile to public or unlisted)'}
        </p>
      ) : null}
      {shareCode && sharePath && visibility !== 'private' ? (
        <SharePanel shareCode={shareCode} path={sharePath} label="profile" />
      ) : null}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {editing ? (
        <div className="synapse-badge-picker">
          <p className="synapse-settings-hint">
            Click a badge to feature it on your public profile. Click it again
            to clear.
          </p>
          {badges.length > 0 ? (
            <button
              type="button"
              className={`synapse-btn synapse-btn-ghost${featured === '' ? ' is-on' : ''}`}
              onClick={() => saveFeatured('')}
            >
              No featured badge
            </button>
          ) : null}
          <BadgeStrip
            badges={badges}
            featuredId={featured}
            onPick={saveFeatured}
          />
        </div>
      ) : (
        <BadgeStrip badges={badges} featuredId={featured} />
      )}
      {editing ? (
        <fieldset className="synapse-workshop-toggles">
          <legend>Follows and profile saves</legend>
          <label>
            <input
              type="checkbox"
              checked={followsEnabled}
              onChange={(event) =>
                saveSocial({
                  followsEnabled: event.target.checked,
                  savesEnabled,
                })
              }
            />
            Allow followers
          </label>
          <label>
            <input
              type="checkbox"
              checked={savesEnabled}
              onChange={(event) =>
                saveSocial({
                  followsEnabled,
                  savesEnabled: event.target.checked,
                })
              }
            />
            Allow people to save this profile
          </label>
        </fieldset>
      ) : null}
      {editing ? (
        <DecorationPicker
          equipped={equipped}
          unlocked={unlocked}
          onEquip={(id) => {
            setEquipped(id);
            onEquippedChange?.(id);
            void equipDecoration(id).catch((err) => {
              setError(err instanceof Error ? err.message : 'Could not equip decoration.');
            });
          }}
        />
      ) : (
        <p className="synapse-settings-hint">Equipped decoration: {equipped}</p>
      )}
    </section>
  );
}
