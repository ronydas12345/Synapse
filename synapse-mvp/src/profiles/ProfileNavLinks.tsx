import { PathLink } from '../app/AppLink';
import { APP_PATHS, publicProfilePath } from '../app/routes';

export default function ProfileNavLinks({
  here,
  username,
}: {
  here: 'public' | 'settings';
  username?: string;
}) {
  const handle = username?.trim();
  return (
    <p className="synapse-profile-nav">
      {here === 'public' ? (
        <PathLink href={APP_PATHS.profile}>Profile settings</PathLink>
      ) : handle ? (
        <PathLink href={publicProfilePath(handle)}>Public profile</PathLink>
      ) : (
        <span className="synapse-settings-hint">
          Set a username to open your public profile.
        </span>
      )}
    </p>
  );
}
