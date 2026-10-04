import type { Edge, Node } from '@xyflow/react';
import {
  asPathVisibility,
  findPathForWorkshop,
} from '../playlists/library';
import { usePathStore } from '../store';
import type { WorkshopCreation } from './types';

export function openOwnedWorkshopPlaylist(
  item: WorkshopCreation,
  shareKey?: string
): void {
  const state = usePathStore.getState();
  const visibility = asPathVisibility(item.visibility);
  const bound = findPathForWorkshop(state.pathSummaries, {
    workshopId: item.id,
    sourcePathId: item.sourcePathId,
    shareCode: item.shareCode,
    preferId: state.activePathId,
  });
  if (bound) {
    if (state.activePathId !== bound.id) state.switchPlaylist(bound.id);
    state.syncWorkshopListing(item.id, visibility, bound.id);
    usePathStore.setState({
      workshopShareKey: shareKey ?? state.workshopShareKey,
      graphLocked: false,
    });
    return;
  }
  const nodes = item.payload.nodes as Node[];
  const edges = item.payload.edges as Edge[];
  if (!nodes.length) {
    throw new Error('This playlist has no nodes to open.');
  }
  state.importWorkshopGraph(item.title, nodes, edges, false, shareKey, {
    id: item.sourcePathId || undefined,
    workshopId: item.id,
    visibility,
    keepName: true,
    tags: item.tags,
  });
}
