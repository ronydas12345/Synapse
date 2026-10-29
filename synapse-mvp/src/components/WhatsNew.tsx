import { useEffect, useMemo, useState } from 'react';
import changelogRaw from '../../CHANGELOG.md?raw';
import { splitChangelogVersions } from '../pages/changelogMarkdown';
import { APP_PATHS, navigateApp } from '../app/routes';
import {
  dismissWhatsNew,
  isWhatsNewDismissed,
  KNOWN_ISSUES,
  RELEASE_ID,
} from '../release/notes';
import { useAuthStore } from '../auth/authStore';
import { useTutorialStore } from '../tutorial/tutorialStore';

export default function WhatsNew() {
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const tutorialView = useTutorialStore((s) => s.view);
  const [open, setOpen] = useState(false);
  const latest = useMemo(() => {
    const versions = splitChangelogVersions(changelogRaw);
    const withNotes = (list: typeof versions) =>
      list.find((version) => version.body.split('\n').some((line) => line.startsWith('- ')));
    const dated = versions.filter((version) => !version.title.startsWith('[Unreleased]'));
    return withNotes(dated) ?? withNotes(versions) ?? versions[0];
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    if (tutorialView !== 'closed') return;
    if (isWhatsNewDismissed()) return;
    setOpen(true);
  }, [signedIn, tutorialView]);

  if (!open || !latest) return null;

  const close = () => {
    dismissWhatsNew();
    setOpen(false);
  };

  return (
    <div className="synapse-tutorial-dialog-layer" role="presentation">
      <div
        className="synapse-tutorial-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="synapse-whats-new-title"
      >
        <h2 id="synapse-whats-new-title">What’s new · {RELEASE_ID}</h2>
        <p className="synapse-settings-lead">{latest.title}</p>
        <ul className="synapse-whats-new-list">
          {latest.body
            .split('\n')
            .map((line) => line.replace(/^- /, '').trim())
            .filter((line) => line && !line.startsWith('#') && !line.startsWith('###'))
            .slice(0, 8)
            .map((line) => (
              <li key={line}>{line}</li>
            ))}
        </ul>
        <h3>Known issues</h3>
        <ul className="synapse-whats-new-list">
          {KNOWN_ISSUES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="synapse-tutorial-actions">
          <button type="button" className="synapse-btn synapse-btn-play" onClick={close}>
            Got it
          </button>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => {
              close();
              navigateApp(APP_PATHS.settings, 'settings-support');
            }}
          >
            Report a problem
          </button>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => {
              close();
              navigateApp(APP_PATHS.changelog);
            }}
          >
            Full changelog
          </button>
        </div>
      </div>
    </div>
  );
}
