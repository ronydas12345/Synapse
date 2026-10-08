import { isPortalId, normalizePortalId } from './ids';
import type {
  PlaylistPortalPolicy,
  PlaylistPortalPolicyMode,
  PortalAccessMode,
  PortalAccessPolicy,
  PortalDestination,
  PortalDestinationMode,
  PortalDestinationType,
  PortalNodeData,
} from './types';

export type { PlaylistPortalPolicy };

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const id = normalizePortalId(item);
    if (!isPortalId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function asDestinationType(value: unknown): PortalDestinationType {
  return value === 'workshop' ? 'workshop' : 'internal';
}

function asDestinationMode(value: unknown): PortalDestinationMode {
  return value === 'portal' ? 'portal' : 'playlist_start';
}

function asAccessMode(value: unknown): PortalAccessMode {
  if (value === 'allowlist' || value === 'blacklist') return value;
  return 'inherit';
}

export function parsePortalDestination(raw: unknown): PortalDestination | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const playlistId = String(rec.playlistId || rec.playlist_id || '').trim();
  if (!playlistId) return null;
  const mode = asDestinationMode(rec.mode);
  const portalId = normalizePortalId(rec.portalId || rec.portal_id).slice(0, 16);
  return {
    type: asDestinationType(rec.type),
    playlistId: playlistId.slice(0, 80),
    mode,
    portalId: mode === 'portal' ? portalId : '',
  };
}

export function parsePortalAccessPolicy(raw: unknown): PortalAccessPolicy {
  const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    mode: asAccessMode(rec.mode),
    allowedSourcePortalIds: asStringList(
      rec.allowedSourcePortalIds || rec.allowed_source_portal_ids
    ),
    blockedSourcePortalIds: asStringList(
      rec.blockedSourcePortalIds || rec.blocked_source_portal_ids
    ),
  };
}

export function defaultPortalAccessPolicy(): PortalAccessPolicy {
  return { mode: 'inherit', allowedSourcePortalIds: [], blockedSourcePortalIds: [] };
}

export function parsePortalNodeData(
  raw: unknown,
  fallbackPortalId: string
): PortalNodeData {
  const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const portalId = isPortalId(rec.portalId)
    ? normalizePortalId(rec.portalId)
    : fallbackPortalId;
  const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 60) : '';
  return {
    name,
    portalId,
    destination: parsePortalDestination(rec.destination),
    accessPolicy: parsePortalAccessPolicy(rec.accessPolicy || rec.access_policy),
  };
}

function asPolicyMode(value: unknown): PlaylistPortalPolicyMode {
  if (
    value === 'disabled' ||
    value === 'allow_all' ||
    value === 'allowlist' ||
    value === 'blacklist'
  ) {
    return value;
  }
  return 'allow_all';
}

export function defaultPlaylistPortalPolicy(
  visibility: 'public' | 'unlisted' | 'private'
): PlaylistPortalPolicy {
  if (visibility === 'public') {
    return { enabled: true, mode: 'allow_all', allowedPortalIds: [], blockedPortalIds: [] };
  }
  return { enabled: false, mode: 'disabled', allowedPortalIds: [], blockedPortalIds: [] };
}

export function parsePlaylistPortalPolicy(
  raw: unknown,
  visibility: 'public' | 'unlisted' | 'private'
): PlaylistPortalPolicy {
  const fallback = defaultPlaylistPortalPolicy(visibility);
  if (!raw || typeof raw !== 'object') return fallback;
  const rec = raw as Record<string, unknown>;
  const mode = asPolicyMode(rec.mode);
  const enabled = rec.enabled === undefined ? mode !== 'disabled' : rec.enabled === true;
  return {
    enabled,
    mode: enabled ? (mode === 'disabled' ? 'allow_all' : mode) : 'disabled',
    allowedPortalIds: asStringList(rec.allowedPortalIds || rec.allowed_portal_ids),
    blockedPortalIds: asStringList(rec.blockedPortalIds || rec.blocked_portal_ids),
  };
}

export function portalDataRecord(data: PortalNodeData): Record<string, unknown> {
  return {
    name: data.name,
    portalId: data.portalId,
    destination: data.destination,
    accessPolicy: data.accessPolicy,
  };
}
