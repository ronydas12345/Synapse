import type { Edge } from '@xyflow/react';
import { PORTAL_IN_HANDLE, PORTAL_OUT_HANDLE, type PortalRole } from './types';

export function isPlayEdge(edge: { id?: string }): boolean {
  return !String(edge.id || '').startsWith('dashed-');
}

export function portalIncomingEdges(
  nodeId: string,
  edges: Pick<Edge, 'id' | 'source' | 'target' | 'targetHandle'>[]
): Pick<Edge, 'id' | 'source' | 'target' | 'targetHandle'>[] {
  return edges.filter(
    (edge) => isPlayEdge(edge) && edge.target === nodeId && edge.targetHandle !== PORTAL_OUT_HANDLE
  );
}

export function portalOutgoingEdges(
  nodeId: string,
  edges: Pick<Edge, 'id' | 'source' | 'target' | 'sourceHandle'>[]
): Pick<Edge, 'id' | 'source' | 'target' | 'sourceHandle'>[] {
  return edges.filter(
    (edge) => isPlayEdge(edge) && edge.source === nodeId && edge.sourceHandle !== PORTAL_IN_HANDLE
  );
}

/**
 * XOR role from wiring:
 * incoming plugged = this playlist is leaving (exit)
 * outgoing plugged = this playlist is receiving (entry)
 */
export function portalRole(
  nodeId: string,
  edges: Pick<Edge, 'id' | 'source' | 'target' | 'sourceHandle' | 'targetHandle'>[]
): PortalRole {
  const incoming = portalIncomingEdges(nodeId, edges).length > 0;
  const outgoing = portalOutgoingEdges(nodeId, edges).length > 0;
  if (incoming && outgoing) return 'invalid';
  if (incoming) return 'exit';
  if (outgoing) return 'entry';
  return 'unset';
}

export function portalHandleEnabled(
  role: PortalRole,
  handle: typeof PORTAL_IN_HANDLE | typeof PORTAL_OUT_HANDLE
): boolean {
  if (role === 'invalid') return false;
  if (handle === PORTAL_IN_HANDLE) return role !== 'entry';
  return role !== 'exit';
}

export function portalRoleLabel(role: PortalRole): string {
  if (role === 'exit') return 'Exit';
  if (role === 'entry') return 'Entry';
  if (role === 'invalid') return 'Invalid';
  return 'Unwired';
}
