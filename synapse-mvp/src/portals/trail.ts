import type { Edge, Node } from '@xyflow/react';
import type { PortalHopContext } from './resolve';
import { routeKey } from './resolve';

export const PLAYLIST_START_PORTAL_LABEL = 'Start';

export interface PortalTrailStop {
  playlistId: string;
  playlistName: string;
  portalId: string;
  landingNodeId: string;
  workshopShareKey: string | null;
  locked: boolean;
  memoryOnly: boolean;
  nodes: Node[];
  edges: Edge[];
}

export function portalStopLabel(portalId: string): string {
  const id = portalId.trim();
  return id || PLAYLIST_START_PORTAL_LABEL;
}

export function formatPortalTrailStop(
  stop: Pick<PortalTrailStop, 'playlistName' | 'portalId'>
): string {
  return `[${stop.playlistName}, ${portalStopLabel(stop.portalId)}]`;
}

export function snapshotPortalTrailStop(
  stop: Omit<PortalTrailStop, 'portalId'> & { portalId: string }
): PortalTrailStop {
  return {
    ...stop,
    portalId: portalStopLabel(stop.portalId),
  };
}

export function appendPortalHop(
  trail: PortalTrailStop[],
  from: PortalTrailStop,
  to: PortalTrailStop
): PortalTrailStop[] {
  if (trail.length === 0) return [from, to];
  const last = trail[trail.length - 1];
  if (last.playlistId === from.playlistId) {
    return [
      ...trail.slice(0, -1),
      {
        ...from,
        landingNodeId: last.landingNodeId,
      },
      to,
    ];
  }
  return [...trail, to];
}

export function hopContextFromTrail(trail: PortalTrailStop[]): PortalHopContext {
  const visited: string[] = [];
  for (let i = 0; i < trail.length - 1; i++) {
    const portalId = trail[i].portalId;
    if (!portalId || portalId === PLAYLIST_START_PORTAL_LABEL) continue;
    visited.push(routeKey(trail[i + 1].playlistId, portalId));
  }
  return { visited, hops: Math.max(0, trail.length - 1) };
}
