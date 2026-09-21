import { useAuthStore } from './authStore';
import { isIdentityComplete } from './identity';
import { useProfileStore } from '../profile/profileStore';

export function useAuthAccess() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const username = useProfileStore((s) => s.profile.username);
  const displayName = useProfileStore((s) => s.profile.displayName);
  const complete = Boolean(user && isIdentityComplete(username, displayName));
  return { status, user, complete };
}
