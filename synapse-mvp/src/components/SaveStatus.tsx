import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  getSaveSnapshot,
  retryWorkspaceSave,
  subscribeSaveStatus,
} from '../cloud/persistGate';
import { toast } from '../ui/toastStore';

export default function SaveStatus() {
  const snap = useSyncExternalStore(
    subscribeSaveStatus,
    getSaveSnapshot,
    getSaveSnapshot
  );
  const [dismissedSaved, setDismissedSaved] = useState(false);
  const prevStatus = useRef(snap.status);

  useEffect(() => {
    if (prevStatus.current !== 'saved' && snap.status === 'saved') {
      toast('Saved', 'success', undefined, {
        id: 'workspace-saved',
        quiet: true,
        timeoutMs: 1800,
      });
    }
    prevStatus.current = snap.status;
  }, [snap.status]);

  useEffect(() => {
    if (snap.status !== 'saved') {
      setDismissedSaved(false);
      return;
    }
    const hide = window.setTimeout(() => setDismissedSaved(true), 1600);
    return () => window.clearTimeout(hide);
  }, [snap.status]);

  if (snap.status === 'idle') return null;
  if (snap.status === 'saved' && dismissedSaved) return null;

  const label =
    snap.status === 'saving'
      ? 'Saving…'
      : snap.status === 'saved'
        ? 'Saved'
        : snap.status === 'failed'
          ? 'Save failed'
          : 'Unsaved';

  return (
    <div
      className={`synapse-save-status is-${snap.status}`}
      role="status"
      aria-live={snap.status === 'unsaved' || snap.status === 'saved' ? 'off' : 'polite'}
    >
      <span>{label}</span>
      {snap.status === 'failed' ? (
        <button
          type="button"
          className="synapse-save-status-retry"
          onClick={() => void retryWorkspaceSave()}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
