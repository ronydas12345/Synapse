import { useEffect } from 'react';
import { isTypingTarget } from './isTypingTarget';
import { flushWorkspaceNow, getSaveSnapshot } from '../cloud/persistGate';
import { usePathStore } from '../store';
import { toast } from './toastStore';
import { useShortcutHelpStore } from './shortcutHelpStore';
import { pathToRoute } from '../app/routes';

export default function EditorHotkeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const meta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const route = pathToRoute(window.location.pathname);
      const store = usePathStore.getState();

      if (meta && key === 'z') {
        if (store.graphLocked) return;
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (meta && key === 'y') {
        if (store.graphLocked) return;
        event.preventDefault();
        store.redo();
        return;
      }
      if (meta && key === 's') {
        event.preventDefault();
        void flushWorkspaceNow().then(() => {
          const snap = getSaveSnapshot();
          if (snap.status === 'failed') {
            toast(snap.error || 'Unable to save changes. Retry.', 'error', {
              label: 'Retry',
              onClick: () => void flushWorkspaceNow(),
            });
            return;
          }
          toast('Changes saved.', 'success');
        });
        return;
      }
      if (meta && (key === '/' || event.key === '?')) {
        event.preventDefault();
        useShortcutHelpStore.getState().toggle();
        return;
      }
      if (event.key === ' ' && (route === 'edit' || route === 'listen')) {
        event.preventDefault();
        store.setIsPlaying(!store.isPlaying);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
