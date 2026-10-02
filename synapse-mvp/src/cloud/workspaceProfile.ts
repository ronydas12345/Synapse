import { firstFilled } from '../auth/identity';
import {
  asProfileVisibility,
  emptyProfile,
  type UserProfile,
} from '../profile/types';

export type ServerProfileFields = {
  visibility?: unknown;
  bio?: unknown;
};

function asCloudProfile(value: unknown): Partial<UserProfile> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Partial<UserProfile>;
}

export function mergeWorkspaceProfile(
  cloud: unknown,
  identity: Pick<UserProfile, 'username' | 'displayName'> | undefined,
  current: UserProfile,
  server?: ServerProfileFields | null
): UserProfile {
  const fromCloud = asCloudProfile(cloud);
  const serverVis =
    server && server.visibility != null
      ? asProfileVisibility(server.visibility)
      : null;
  const serverBio = typeof server?.bio === 'string' ? server.bio.slice(0, 280) : null;
  return {
    ...emptyProfile(),
    ...fromCloud,
    username: firstFilled(identity?.username, current.username, fromCloud.username),
    displayName: firstFilled(
      identity?.displayName,
      current.displayName,
      fromCloud.displayName
    ),
    visibility: serverVis ?? asProfileVisibility(fromCloud.visibility),
    bio: serverBio ?? String(fromCloud.bio || current.bio || '').slice(0, 280),
    avatarDataUrl: null,
  };
}
