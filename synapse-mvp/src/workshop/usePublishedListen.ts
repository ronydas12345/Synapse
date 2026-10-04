import { useEffect } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { findPathForWorkshop } from '../playlists/library';
import { useAuthStore } from '../auth/authStore';
import { usePathStore } from '../store';
import { getWorkshopCreation } from './api';
import { markWorkshopGuestSession } from './guestSession';
import { openOwnedWorkshopPlaylist } from './ownedPath';
import { syncOwnPlaylistListings } from './syncListings';

function alreadyLoaded(id: string): boolean {
  const state = usePathStore.getState();
  if (state.nodes.length <= 1) return false;
  if (state.activePathId === id) return true;
  const active = state.pathSummaries.find((path) => path.id === state.activePathId);
  if (
    !state.graphLocked &&
    (active?.workshopId === id || state.workshopShareKey === id)
  ) {
    return true;
  }
  if (state.workshopShareKey !== id) return false;
  if (state.graphLocked) return true;
  const bound = findPathForWorkshop(state.pathSummaries, {
    workshopId: id,
    shareCode: id,
    preferId: state.activePathId,
  });
  return !bound || state.activePathId === bound.id;
}

export function usePublishedListen(id: string | undefined): void {
  useEffect(() => {
    if (!id) return;
    if (alreadyLoaded(id)) {
      const state = usePathStore.getState();
      if (!state.graphLocked) {
        if (state.listenView !== 'graph') state.setListenView('graph');
      } else if (state.listenView !== 'list') {
        state.setListenView('graph');
      }
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const item = await getWorkshopCreation(id);
        if (cancelled || !item || item.kind === 'theme') return;
        const nodes = item.payload.nodes as Node[];
        const edges = item.payload.edges as Edge[];
        if (!nodes.length) return;
        const key = item.shareCode || item.id || id;
        const uid = useAuthStore.getState().user?.uid;
        const own = Boolean(uid && uid === item.creatorUid);
        if (own) {
          openOwnedWorkshopPlaylist(item, key);
          usePathStore.getState().setListenView('graph');
          return;
        }
        markWorkshopGuestSession();
        if (cancelled) return;
        usePathStore
          .getState()
          .importWorkshopGraph(item.title, nodes, edges, true, key);
      } catch {
        /* keep the graph already in memory */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);
}

export function useSyncOwnWorkshopListings(): void {
  const uid = useAuthStore((s) => s.user?.uid);
  const workspaceReady = useAuthStore((s) => s.workspaceStatus === 'ready');
  useEffect(() => {
    if (!uid || !workspaceReady) return;
    void syncOwnPlaylistListings().catch(() => {});
  }, [uid, workspaceReady]);
}
