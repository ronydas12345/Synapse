import type { Edge, Node } from '@xyflow/react';
import { useAuthStore } from '../auth/authStore';
import { usePathStore } from '../store';
import { getWorkshopCreation } from '../workshop/api';
import { parsePortalNodeData } from './parse';
import {
  catalogFromLibrary,
  resolvePortalHop,
  type PortalCatalogPlaylist,
  type PortalHopContext,
  type PortalResolveResult,
} from './resolve';

export async function loadWorkshopPlaylist(
  id: string
): Promise<PortalCatalogPlaylist | null> {
  try {
    const item = await getWorkshopCreation(id);
    if (!item || item.kind === 'theme') return null;
    const uid = useAuthStore.getState().user?.uid;
    return {
      id: item.id,
      name: item.title,
      visibility: item.visibility,
      workshopId: item.shareCode || item.id,
      nodes: (item.payload.nodes || []) as Node[],
      edges: (item.payload.edges || []) as Edge[],
      owner: Boolean(uid && uid === item.creatorUid),
      portalPolicy: (item.payload as { portalPolicy?: unknown }).portalPolicy,
    };
  } catch {
    return null;
  }
}

export async function hopFromPortalNode(
  portalNode: Node,
  context: PortalHopContext,
  editor: boolean
): Promise<PortalResolveResult> {
  const store = usePathStore.getState();
  const paths = store.peekLibraryPaths();
  const here = store.playbackGraphOverride
    ? store.portalTrail[store.portalTrail.length - 1]
    : undefined;
  const currentId = here?.playlistId || store.activePathId;
  const current = paths.find((path) => path.id === currentId);
  const source: PortalCatalogPlaylist = {
    id: currentId,
    name: current?.name || here?.playlistName || 'Playlist',
    visibility: current?.visibility || 'private',
    workshopId: current?.workshopId || store.workshopShareKey || undefined,
    nodes: store.nodes,
    edges: store.edges,
    owner: !store.graphLocked,
    portalPolicy: current?.portalPolicy,
  };
  const catalog = catalogFromLibrary(paths, true).map((path) =>
    path.id === source.id ? source : { ...path, owner: true }
  );
  if (!catalog.some((path) => path.id === source.id)) catalog.unshift(source);

  let result = resolvePortalHop({
    source,
    portalNode,
    catalog,
    context,
    editor,
  });
  if (result.ok) return result;

  const destId = parsePortalNodeData(portalNode.data, '').destination?.playlistId || '';
  if (!destId || catalog.some((path) => path.id === destId || path.workshopId === destId)) {
    return result;
  }
  const workshop = await loadWorkshopPlaylist(destId);
  if (!workshop) return result;
  return resolvePortalHop({
    source,
    portalNode,
    catalog: [...catalog, workshop],
    context,
    editor,
  });
}
