export const PORTAL_IN_HANDLE = 'in';
export const PORTAL_OUT_HANDLE = 'out';
export const MAX_PORTAL_HOPS = 32;
/** Exit portals may merge this many incoming paths. Other node types keep the single-input rule. */
export const MAX_PORTAL_INPUTS = 2;

export type PortalRole = 'unset' | 'exit' | 'entry' | 'invalid';

export type PortalDestinationType = 'internal' | 'workshop';
export type PortalDestinationMode = 'playlist_start' | 'portal';
export type PortalAccessMode = 'inherit' | 'allowlist' | 'blacklist';
export type PlaylistPortalPolicyMode = 'disabled' | 'allow_all' | 'allowlist' | 'blacklist';

export interface PortalDestination {
  type: PortalDestinationType;
  playlistId: string;
  mode: PortalDestinationMode;
  portalId: string;
}

export interface PortalAccessPolicy {
  mode: PortalAccessMode;
  allowedSourcePortalIds: string[];
  blockedSourcePortalIds: string[];
}

export interface PortalNodeData {
  name: string;
  portalId: string;
  destination: PortalDestination | null;
  accessPolicy: PortalAccessPolicy;
}

export interface PlaylistPortalPolicy {
  enabled: boolean;
  mode: PlaylistPortalPolicyMode;
  allowedPortalIds: string[];
  blockedPortalIds: string[];
}

export type PortalDenyCode =
  | 'PORTAL_NOT_FOUND'
  | 'PORTAL_INVALID_CONFIGURATION'
  | 'PORTAL_DESTINATION_NOT_FOUND'
  | 'PORTAL_DESTINATION_PRIVATE'
  | 'PORTAL_DESTINATION_UNAVAILABLE'
  | 'PORTAL_ACCESS_DENIED'
  | 'PORTAL_NOT_ALLOWED'
  | 'PORTAL_BLOCKED'
  | 'PORTAL_LOOP_DETECTED'
  | 'PORTAL_HOP_LIMIT'
  | 'PORTAL_UNLISTED_DISABLED'
  | 'PORTAL_SELF_TARGET';

export const VIEWER_PORTAL_ERROR =
  'This portal destination is unavailable.';
