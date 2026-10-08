import { isPortalId, normalizePortalId } from './ids';
import type { PlaylistPortalPolicy, PortalAccessPolicy, PortalDenyCode } from './types';

export function sourceAllowedByPlaylistPolicy(
  policy: PlaylistPortalPolicy,
  sourcePortalId: string
): PortalDenyCode | null {
  const source = normalizePortalId(sourcePortalId);
  if (!isPortalId(source)) return 'PORTAL_INVALID_CONFIGURATION';
  if (!policy.enabled || policy.mode === 'disabled') return 'PORTAL_UNLISTED_DISABLED';
  if (policy.mode === 'allow_all') return null;
  if (policy.mode === 'allowlist') {
    return policy.allowedPortalIds.includes(source) ? null : 'PORTAL_NOT_ALLOWED';
  }
  if (policy.mode === 'blacklist') {
    return policy.blockedPortalIds.includes(source) ? null : 'PORTAL_BLOCKED';
  }
  return 'PORTAL_ACCESS_DENIED';
}

export function sourceAllowedByPortalPolicy(
  policy: PortalAccessPolicy,
  sourcePortalId: string
): PortalDenyCode | null {
  const source = normalizePortalId(sourcePortalId);
  if (!isPortalId(source)) return 'PORTAL_INVALID_CONFIGURATION';
  if (policy.mode === 'inherit') return null;
  if (policy.mode === 'allowlist') {
    return policy.allowedSourcePortalIds.includes(source) ? null : 'PORTAL_NOT_ALLOWED';
  }
  if (policy.mode === 'blacklist') {
    return policy.blockedSourcePortalIds.includes(source) ? 'PORTAL_BLOCKED' : null;
  }
  return 'PORTAL_ACCESS_DENIED';
}

export function inboundPortalAllowed(args: {
  sourcePortalId: string;
  playlistPolicy: PlaylistPortalPolicy;
  portalPolicy?: PortalAccessPolicy | null;
  ownerHop: boolean;
}): PortalDenyCode | null {
  if (args.ownerHop) return null;
  const playlistDeny = sourceAllowedByPlaylistPolicy(
    args.playlistPolicy,
    args.sourcePortalId
  );
  if (playlistDeny) return playlistDeny;
  if (!args.portalPolicy) return null;
  return sourceAllowedByPortalPolicy(args.portalPolicy, args.sourcePortalId);
}
