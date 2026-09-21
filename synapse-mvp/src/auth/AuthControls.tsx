import { AppLink } from '../app/AppLink';
import { isIdentityComplete } from './identity';
import { useAuthStore } from './authStore';
import { useProfileStore } from '../profile/profileStore';

export default function AuthControls({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const username = useProfileStore((s) => s.profile.username);
  const displayName = useProfileStore((s) => s.profile.displayName);
  const localAvatar = useProfileStore((s) => s.profile.avatarDataUrl);
  const avatarUrl = useProfileStore((s) => s.profile.avatarUrl);
  const photo = localAvatar || avatarUrl;
  const complete = isIdentityComplete(username, displayName);

  const linkClass = compact ? 'synapse-auth-chip' : 'synapse-mkt-text-link';

  if (status === 'loading') {
    return (
      <span className={linkClass} aria-live="polite">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <AppLink to="login" className={linkClass} onNavigate={onNavigate}>
        Log in
      </AppLink>
    );
  }

  if (!complete) {
    return (
      <AppLink to="signup" className={linkClass} onNavigate={onNavigate}>
        Finish signup
      </AppLink>
    );
  }

  const label = `@${username}`;

  return (
    <AppLink
      to="profile"
      className={linkClass}
      title={user.email || 'Signed in'}
      onNavigate={onNavigate}
    >
      {photo ? (
        <img src={photo} alt="" className="synapse-mode-avatar" width={18} height={18} />
      ) : null}
      {label}
    </AppLink>
  );
}
