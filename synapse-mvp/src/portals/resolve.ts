import type { Edge, Node } from '@xyflow/react';
import type { PathVisibility, StoredMusicPath } from '../playlists/library';
import { isPortalId, normalizePortalId } from './ids';
import { parsePlaylistPortalPolicy, parsePortalNodeData } from './parse';
import { inboundPortalAllowed } from './policy';
import { findPortalNode } from './remap';
import { portalOutgoingEdges, portalRole } from './role';
import {
  MAX_PORTAL_HOPS,
  VIEWER_PORTAL_ERROR,
  type PortalDenyCode,
} from './types';

export interface PortalCatalogPlaylist {
  id: string;
  name: string;
  visibility: PathVisibility;
  workshopId?: string;
  nodes: Node[];
  edges: Edge[];
  owner: boolean;
  portalPolicy?: unknown;
}

export interface PortalHopContext {
  visited: string[];
  hops: number;
}

export interface PortalResolveOk {
  ok: true;
  landingNodeId: string;
  graph: { nodes: Node[]; edges: Edge[] };
  playlistId: string;
  playlistName: string;
  workshopShareKey?: string;
}

export interface PortalResolveDeny {
  ok: false;
  code: PortalDenyCode;
  message: string;
}

export type PortalResolveResult = PortalResolveOk | PortalResolveDeny;

function routeKey(playlistId: string, portalId: string): string {
  return `${playlistId}:${normalizePortalId(portalId)}`;
}

function deny(code: PortalDenyCode, editor = false, detail?: string): PortalResolveDeny {
  return {
    ok: false,
    code,
    message: editor && detail ? detail : VIEWER_PORTAL_ERROR,
  };
}

function startNodeId(nodes: Node[]): string | null {
  return nodes.find((node) => node.type === 'start')?.id ?? null;
}

export function destinationPlaylistId(
  destPlaylistId: string,
  currentPlaylistId: string
): string {
  const id = destPlaylistId.trim();
  if (!id || id === '.' || id === 'self' || id === currentPlaylistId) return currentPlaylistId;
  return id;
}

export function resolvePortalHop(args: {
  source: PortalCatalogPlaylist;
  portalNode: Node;
  catalog: PortalCatalogPlaylist[];
  context: PortalHopContext;
  editor?: boolean;
}): PortalResolveResult {
  const { source, portalNode, catalog, context, editor } = args;
  if (portalNode.type !== 'portal') {
    return deny('PORTAL_NOT_FOUND', editor, 'That node is not a portal.');
  }
  const role = portalRole(portalNode.id, source.edges);
  if (role !== 'exit') {
    return deny(
      'PORTAL_INVALID_CONFIGURATION',
      editor,
      'Playback only leaves through a portal that has an incoming path.'
    );
  }
  const data = parsePortalNodeData(portalNode.data, '');
  if (!isPortalId(data.portalId)) {
    return deny('PORTAL_INVALID_CONFIGURATION', editor, 'This portal is missing a Portal ID.');
  }
  if (context.hops >= MAX_PORTAL_HOPS) {
    return deny('PORTAL_HOP_LIMIT', editor, 'This portal chain is too long.');
  }
  const dest = data.destination;
  if (!dest?.playlistId) {
    return deny('PORTAL_INVALID_CONFIGURATION', editor, 'Set a destination playlist.');
  }
  if (dest.mode === 'portal' && !isPortalId(dest.portalId)) {
    return deny(
      'PORTAL_INVALID_CONFIGURATION',
      editor,
      'Pick a destination portal, or send playback to the beginning.'
    );
  }

  const targetPlaylistId = destinationPlaylistId(dest.playlistId, source.id);
  const key = routeKey(targetPlaylistId, data.portalId);
  if (context.visited.includes(key)) {
    return deny('PORTAL_LOOP_DETECTED', editor, 'This portal route loops back on itself.');
  }

  const target =
    catalog.find((path) => path.id === targetPlaylistId) ||
    catalog.find((path) => path.workshopId && path.workshopId === targetPlaylistId);

  if (!target) {
    return deny('PORTAL_DESTINATION_NOT_FOUND', editor, 'Destination playlist no longer exists.');
  }

  if (!target.owner && target.visibility === 'private') {
    return deny('PORTAL_DESTINATION_PRIVATE');
  }

  const playlistPolicy = parsePlaylistPortalPolicy(target.portalPolicy, target.visibility);
  const landingPortal =
    dest.mode === 'portal' ? findPortalNode(target.nodes, dest.portalId) : undefined;
  if (dest.mode === 'portal' && !landingPortal) {
    return deny(
      'PORTAL_DESTINATION_NOT_FOUND',
      editor,
      'Destination portal no longer exists.'
    );
  }

  if (
    dest.mode === 'portal' &&
    landingPortal &&
    normalizePortalId(data.portalId) ===
      normalizePortalId((landingPortal.data as { portalId?: unknown })?.portalId) &&
    target.id === source.id
  ) {
    return deny('PORTAL_SELF_TARGET', editor, 'A portal cannot target itself.');
  }

  const landingData = landingPortal
    ? parsePortalNodeData(landingPortal.data, '')
    : null;
  const inbound = inboundPortalAllowed({
    sourcePortalId: data.portalId,
    playlistPolicy,
    portalPolicy: landingData?.accessPolicy,
    ownerHop: source.owner && target.owner,
  });
  if (inbound) {
    return deny(
      inbound,
      editor,
      inbound === 'PORTAL_UNLISTED_DISABLED'
        ? 'The destination playlist does not allow portal entry.'
        : 'The destination playlist blocked this portal.'
    );
  }

  if (dest.mode === 'playlist_start') {
    const start = startNodeId(target.nodes);
    if (!start) {
      return deny(
        'PORTAL_DESTINATION_UNAVAILABLE',
        editor,
        'Destination playlist cannot be started.'
      );
    }
    return {
      ok: true,
      landingNodeId: start,
      graph: { nodes: target.nodes, edges: target.edges },
      playlistId: target.id,
      playlistName: target.name,
      workshopShareKey: target.workshopId,
    };
  }

  const landingRole = landingPortal ? portalRole(landingPortal.id, target.edges) : 'unset';
  if (landingRole !== 'entry') {
    return deny(
      'PORTAL_INVALID_CONFIGURATION',
      editor,
      'The destination portal must be an entry (outgoing path only).'
    );
  }
  const outgoing = landingPortal
    ? portalOutgoingEdges(landingPortal.id, target.edges)
    : [];
  if (!outgoing[0]?.target) {
    return deny(
      'PORTAL_INVALID_CONFIGURATION',
      editor,
      'The destination portal has no exit route.'
    );
  }

  return {
    ok: true,
    landingNodeId: landingPortal!.id,
    graph: { nodes: target.nodes, edges: target.edges },
    playlistId: target.id,
    playlistName: target.name,
    workshopShareKey: target.workshopId,
  };
}

export function catalogFromLibrary(
  paths: StoredMusicPath[],
  owner = true
): PortalCatalogPlaylist[] {
  return paths.map((path) => ({
    id: path.id,
    name: path.name,
    visibility: path.visibility,
    workshopId: path.workshopId,
    nodes: path.nodes,
    edges: path.edges,
    owner,
    portalPolicy: path.portalPolicy,
  }));
}

export function nextHopContext(
  context: PortalHopContext,
  playlistId: string,
  portalId: string
): PortalHopContext {
  return {
    hops: context.hops + 1,
    visited: [...context.visited, routeKey(playlistId, portalId)],
  };
}
