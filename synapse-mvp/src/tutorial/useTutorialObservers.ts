import { useEffect } from 'react';
import type { Node } from '@xyflow/react';
import { usePathStore } from '../store';
import { useThemeStore } from '../theme/themeStore';
import { useTutorialStore } from './tutorialStore';
import { isIdentityComplete } from '../auth/identity';
import { useAuthStore } from '../auth/authStore';
import { useProfileStore } from '../profile/profileStore';
import type { TutorialAction } from './tutorialTypes';
import { pathToRoute, type AppRoute } from '../app/routes';

function emit(event: TutorialAction): void {
  useTutorialStore.getState().applyEvent(event);
}

function nodeMap(nodes: Node[]): Map<string, Node> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function trackUrlFilled(prev: Node | undefined, next: Node | undefined): boolean {
  if (!next || next.type !== 'track') return false;
  const before = String(prev?.data?.videoId || '').trim();
  const after = String(next.data?.videoId || '').trim();
  return after.length > 0 && after !== before;
}

export function useTutorialObservers(route: AppRoute): void {
  useEffect(() => {
    emit({ type: 'route', route });
  }, [route]);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('settings-')) {
        emit({ type: 'settings-section', id: hash.replace(/^settings-/, '') });
      }
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let prev = usePathStore.getState();
    const unsub = usePathStore.subscribe((state) => {
      if (state.nodes.length > prev.nodes.length) {
        const prevIds = new Set(prev.nodes.map((n) => n.id));
        const added = state.nodes.find((n) => !prevIds.has(n.id));
        if (added?.type) emit({ type: 'node-created', nodeType: added.type });
      }
      if (state.nodes.length < prev.nodes.length) emit({ type: 'node-deleted' });
      if (state.edges.length > prev.edges.length) emit({ type: 'nodes-connected' });
      if (state.edges.length < prev.edges.length) emit({ type: 'edge-deleted' });
      if (state.selectedNodeId && state.selectedNodeId !== prev.selectedNodeId) {
        const node = state.nodes.find((n) => n.id === state.selectedNodeId);
        emit({ type: 'node-selected', nodeType: node?.type });
      }
      if (state.isPlaying && !prev.isPlaying) emit({ type: 'playing' });
      if (!state.isPlaying && prev.isPlaying) emit({ type: 'paused' });
      if (state.skipRequestId !== prev.skipRequestId) emit({ type: 'skip' });

      const beforeNodes = nodeMap(prev.nodes);
      for (const node of state.nodes) {
        const old = beforeNodes.get(node.id);
        if (!old) continue;
        if (trackUrlFilled(old, node)) emit({ type: 'track-url' });
        const oldData = (old.data ?? {}) as Record<string, unknown>;
        const newData = (node.data ?? {}) as Record<string, unknown>;
        for (const field of Object.keys(newData)) {
          if (oldData[field] !== newData[field] && node.type) {
            emit({ type: 'node-data', nodeType: node.type, field });
          }
        }
      }
      prev = state;
    });
    return unsub;
  }, []);

  useEffect(() => {
    let prevId = useThemeStore.getState().activeId;
    const unsub = useThemeStore.subscribe((state) => {
      if (state.activeId !== prevId) {
        prevId = state.activeId;
        emit({ type: 'theme-changed' });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const check = () => {
      const user = useAuthStore.getState().user;
      const profile = useProfileStore.getState().profile;
      if (user && isIdentityComplete(profile.username, profile.displayName)) {
        emit({ type: 'account-ready' });
      }
    };
    check();
    const stopAuth = useAuthStore.subscribe(check);
    const stopProfile = useProfileStore.subscribe(check);
    return () => {
      stopAuth();
      stopProfile();
    };
  }, []);

  useEffect(() => {
    if (route === 'workshop') {
      /* keep catalog nav steps honest if the user already landed here */
    }
    const path = window.location.pathname;
    emit({ type: 'route', route: pathToRoute(path) });
  }, [route]);
}
