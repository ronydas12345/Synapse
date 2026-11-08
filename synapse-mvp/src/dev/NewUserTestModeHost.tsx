import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { isTypingTarget } from '../ui/isTypingTarget';
import {
  canUseNewUserTestMode,
  enterNewUserTestMode,
  exitNewUserTestMode,
  isNewUserTestMode,
  testModeHasWork,
} from './newUserTestMode';
import { subscribeNewUserTestMode } from './testModeFlag';
import { useAuthStore } from '../auth/authStore';
import '../onboarding/onboarding.css';

function isTestModeChord(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  if (key !== 'n') return false;
  return (event.ctrlKey || event.metaKey) && event.shiftKey && event.altKey;
}

export default function NewUserTestModeHost() {
  const user = useAuthStore((s) => s.user);
  const allowed = canUseNewUserTestMode(user);
  const active = useSyncExternalStore(subscribeNewUserTestMode, isNewUserTestMode, () => false);
  const [exitOpen, setExitOpen] = useState(false);
  const titleId = useId();
  const hasWork = active && testModeHasWork();

  useEffect(() => {
    if (!allowed) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isTestModeChord(event)) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      if (isNewUserTestMode()) {
        setExitOpen(true);
        return;
      }
      void enterNewUserTestMode();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allowed]);

  if (!allowed) return null;

  return (
    <>
      {active ? (
        <div className="synapse-test-mode-banner" role="status">
          <span>New user test mode · changes stay isolated</span>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => setExitOpen(true)}
          >
            Exit
          </button>
        </div>
      ) : null}
      {exitOpen ? (
        <div className="synapse-tutorial-dialog-layer synapse-confirm-layer" role="presentation">
          <div
            className="synapse-tutorial-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId}>Exit New User Test Mode?</h2>
            <p>
              {hasWork
                ? 'Your normal account data will be restored. You can keep playlists you made in this session or discard them.'
                : 'Your normal account data will be restored. Nothing from this session needs to be kept.'}
            </p>
            <div className="synapse-tutorial-actions">
              <button
                type="button"
                className="synapse-btn synapse-btn-ghost"
                onClick={() => setExitOpen(false)}
              >
                Cancel
              </button>
              {hasWork ? (
                <button
                  type="button"
                  className="synapse-btn synapse-btn-play"
                  onClick={() => {
                    setExitOpen(false);
                    void exitNewUserTestMode(true);
                  }}
                >
                  Exit and keep test playlists
                </button>
              ) : null}
              <button
                type="button"
                className="synapse-btn synapse-btn-danger"
                onClick={() => {
                  setExitOpen(false);
                  void exitNewUserTestMode(false);
                }}
              >
                {hasWork ? 'Exit and discard' : 'Exit test mode'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
