import { useEffect, useState } from 'react';
import { AppLink, PathLink } from '../app/AppLink';
import { publicProfilePath } from '../app/routes';
import BadgeStrip from '../badges/BadgeStrip';
import { listEarnedBadges, setFeaturedBadge, type EarnedBadge } from '../badges/api';
import DecorationPicker from '../decorations/DecorationPicker';
import { equipDecoration, listUnlockedDecorations } from '../decorations/api';
import { readOwnCreator } from '../profiles/api';
import { loadGamificationState } from '../gamification/api';
import { TOKEN_LABEL } from '../gamification/types';
import { useAuthStore } from '../auth/authStore';
import { useProfileStore } from '../profile/profileStore';

export default function ProfileRecognition({ editing }: { editing: boolean }) {
  const user = useAuthStore((s) => s.user);
  const username = useProfileStore((s) => s.profile.username);
  const visibility = useProfileStore((s) => s.profile.visibility);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>(['default']);
  const [equipped, setEquipped] = useState('default');
  const [featured, setFeatured] = useState('');
  const [tokens, setTokens] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const [earned, deco, creator, play] = await Promise.all([
          listEarnedBadges(user.uid),
          listUnlockedDecorations(user.uid),
          readOwnCreator(user.uid),
          loadGamificationState().catch(() => null),
        ]);
        if (cancelled) return;
        setBadges(earned);
        setUnlocked(deco.length ? deco : ['default']);
        setEquipped(creator?.equippedDecoration || 'default');
        setFeatured(creator?.featuredBadge || '');
        if (play) setTokens(play.wallet.token_balance);
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

  return (
    <section className="synapse-profile-section">
      <h2>Badges and decorations</h2>
      <p className="synapse-settings-lead">
        Badges are awarded on the server for account age, Workshop publishes,
        Playground games, followers, and staff roles. Decorations are cosmetic
        frames. {TOKEN_LABEL} are virtual and have no cash value.
      </p>
      {tokens != null ? (
        <p>
          {TOKEN_LABEL}: {tokens.toLocaleString()} ·{' '}
          <AppLink to="playground">Open Playground</AppLink>
        </p>
      ) : null}
      {username ? (
        <p className="synapse-settings-hint">
          Public page:{' '}
          <PathLink href={publicProfilePath(username)}>/u/{username}</PathLink>
          {visibility === 'public'
            ? ' (listed while the profile is public)'
            : ' (visible after you set the profile to public)'}
        </p>
      ) : null}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <BadgeStrip badges={badges} featuredId={featured} />
      {editing && badges.length > 0 ? (
        <label className="synapse-settings-field">
          Featured badge
          <select
            className="synapse-settings-input"
            value={featured}
            onChange={(event) => {
              const id = event.target.value;
              setFeatured(id);
              void setFeaturedBadge(id).catch((err) => {
                setError(err instanceof Error ? err.message : 'Could not save badge.');
              });
            }}
          >
            <option value="">None</option>
            {badges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.def.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {editing ? (
        <DecorationPicker
          equipped={equipped}
          unlocked={unlocked}
          onEquip={(id) => {
            setEquipped(id);
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
