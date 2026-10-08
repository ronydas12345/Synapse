import type { Node } from '@xyflow/react';
import { generatePortalId, isPortalId, normalizePortalId } from './ids';
import { parsePortalNodeData, portalDataRecord } from './parse';

export function ensurePortalNodeData(
  nodes: Node[],
  options?: { reissue?: boolean; used?: Iterable<string> }
): Node[] {
  const reserved = new Set(
    [...(options?.used ?? [])].map((id) => normalizePortalId(id)).filter(Boolean)
  );
  const seen = new Set<string>();
  const idMap = new Map<string, string>();
  const next = nodes.map((node) => {
    if (node.type !== 'portal') return node;
    const parsed = parsePortalNodeData(node.data, '');
    let portalId = parsed.portalId;
    const taken = [...reserved, ...seen];
    const mustMint =
      Boolean(options?.reissue) || !isPortalId(portalId) || seen.has(portalId);
    if (mustMint) {
      const previous = isPortalId(portalId) ? portalId : '';
      portalId = generatePortalId(taken);
      if (previous && previous !== portalId) idMap.set(previous, portalId);
    }
    seen.add(portalId);
    reserved.add(portalId);
    return {
      ...node,
      data: {
        ...((node.data && typeof node.data === 'object' ? node.data : {}) as Record<string, unknown>),
        ...portalDataRecord({ ...parsed, portalId }),
      },
    };
  });

  if (idMap.size === 0) return next;

  return next.map((node) => {
    if (node.type !== 'portal') return node;
    const parsed = parsePortalNodeData(node.data, '');
    const dest = parsed.destination;
    if (!dest?.portalId) return node;
    const mapped = idMap.get(normalizePortalId(dest.portalId));
    if (!mapped) return node;
    return {
      ...node,
      data: {
        ...((node.data && typeof node.data === 'object' ? node.data : {}) as Record<string, unknown>),
        ...portalDataRecord({
          ...parsed,
          destination: { ...dest, portalId: mapped },
        }),
      },
    };
  });
}

export function findPortalNode(
  nodes: Node[],
  portalId: string
): Node | undefined {
  const want = normalizePortalId(portalId);
  if (!isPortalId(want)) return undefined;
  return nodes.find((node) => {
    if (node.type !== 'portal') return false;
    return normalizePortalId((node.data as { portalId?: unknown })?.portalId) === want;
  });
}
