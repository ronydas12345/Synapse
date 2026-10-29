import { useSyncExternalStore } from 'react';
import {
  clearPathDraft,
  getPendingRecovery,
  setPendingRecovery,
  subscribePendingRecovery,
} from '../canvas/drafts';
import { usePathStore } from '../store';

export default function DraftRecovery() {
  const draft = useSyncExternalStore(
    subscribePendingRecovery,
    getPendingRecovery,
    getPendingRecovery
  );
  if (!draft) return null;

  return (
    <div className="synapse-recovery" role="alertdialog" aria-labelledby="synapse-recovery-title">
      <div className="synapse-recovery-card">
        <h2 id="synapse-recovery-title">Recover unsaved edits?</h2>
        <p>
          This browser has a newer draft of{' '}
          <strong>{draft.pathName || 'a Music Path'}</strong> than the last
          successful save. Recovering replaces the account copy of that path
          only.
        </p>
        <div className="synapse-tutorial-actions">
          <button
            type="button"
            className="synapse-btn synapse-btn-play"
            onClick={() => {
              usePathStore.getState().restoreDraft(draft);
              clearPathDraft();
              setPendingRecovery(null);
            }}
          >
            Recover draft
          </button>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => {
              clearPathDraft();
              setPendingRecovery(null);
            }}
          >
            Keep saved copy
          </button>
        </div>
      </div>
    </div>
  );
}
