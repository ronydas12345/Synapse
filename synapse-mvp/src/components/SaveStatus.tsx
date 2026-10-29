import { useSyncExternalStore } from 'react';
import {
  getSaveSnapshot,
  retryWorkspaceSave,
  subscribeSaveStatus,
} from '../cloud/persistGate';

export default function SaveStatus() {
  const snap = useSyncExternalStore(
    subscribeSaveStatus,
    getSaveSnapshot,
    getSaveSnapshot
  );
  if (snap.status === 'idle') return null;

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
      aria-live={snap.status === 'unsaved' ? 'off' : 'polite'}
    >
      <span>{label}</span>
      {snap.status === 'failed' ? (
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => void retryWorkspaceSave()}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
