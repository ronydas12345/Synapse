import { useEffect, useRef, useState } from 'react';
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
  onRecognition,
}: {
  editing: boolean;
  onEquippedChange?: (id: string) => void;
  onRecognition?: (next: {
    equipped?: string;
    badges?: EarnedBadge[];
    featured?: string;
  }) => void;
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
  const cosmeticsTouched = useRef(false);
  const onEquippedRef = useRef(onEquippedChange);
  const onRecognitionRef = useRef(onRecognition);
  onEquippedRef.current = onEquippedChange;
  onRecognitionRef.current = onRecognition;

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
          listEarnedBadges(user.uid).catch(() => [] as EarnedBadge[]),
          listUnlockedDecorations(user.uid).catch(() => ['default']),
          readOwnCreator(user.uid).catch(() => null),
        ]);
        if (cancelled) return;
        const nextEquipped = creator?.equippedDecoration || 'default';
        const nextFeatured = creator?.featuredBadge || '';
        setBadges(earned);
        setUnlocked(deco.length ? deco : ['default']);
        if (!cosmeticsTouched.current) {
          setEquipped(nextEquipped);
          setFeatured(nextFeatured);
          onEquippedRef.current?.(nextEquipped);
          onRecognitionRef.current?.({
            equipped: nextEquipped,
            badges: earned,
            featured: nextFeatured,
          });
        } else {
          onRecognitionRef.current?.({ badges: earned });
        }
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
  }, [user]);

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
    const previous = featured;
    cosmeticsTouched.current = true;
    setFeatured(id);
    onRecognition?.({ featured: id });
    void setFeaturedBadge(id).catch((err) => {
      setFeatured(previous);
      onRecognition?.({ featured: previous });
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
      <DecorationPicker
        equipped={equipped}
        unlocked={unlocked}
        disabled={!editing}
        onEquip={(id) => {
          if (!editing) return;
          const previous = equipped;
          cosmeticsTouched.current = true;
          setEquipped(id);
          onEquippedChange?.(id);
          onRecognition?.({ equipped: id });
          void equipDecoration(id).catch((err) => {
            setEquipped(previous);
            onEquippedChange?.(previous);
            onRecognition?.({ equipped: previous });
            setError(err instanceof Error ? err.message : 'Could not equip decoration.');
          });
        }}
      />
    </section>
  );
}
