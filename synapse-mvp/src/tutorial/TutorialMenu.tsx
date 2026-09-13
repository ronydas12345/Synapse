import { useEffect, useId, useMemo, useState } from 'react';
import { useAppRoute } from '../app/AppLink';
import {
  CONTEXT_SECTIONS,
  FULL_TUTORIAL_SECTIONS,
  SIMPLE_TUTORIAL_ID,
  searchHits,
  TUTORIAL_GROUPS,
  getSection,
} from './tutorialCatalog';
import { useTutorialStore } from './tutorialStore';

export default function TutorialMenu() {
  const view = useTutorialStore((s) => s.view);
  const progress = useTutorialStore((s) => s.progress);
  const runKind = useTutorialStore((s) => s.runKind);
  const startSimple = useTutorialStore((s) => s.startSimple);
  const startFull = useTutorialStore((s) => s.startFull);
  const openFullTutorial = useTutorialStore((s) => s.openFullTutorial);
  const startSection = useTutorialStore((s) => s.startSection);
  const openTopics = useTutorialStore((s) => s.openTopics);
  const askSkip = useTutorialStore((s) => s.askSkip);
  const keepTutorial = useTutorialStore((s) => s.keepTutorial);
  const confirmSkip = useTutorialStore((s) => s.confirmSkip);
  const close = useTutorialStore((s) => s.close);
  const maybeLater = useTutorialStore((s) => s.maybeLater);
  const route = useAppRoute();
  const titleId = useId();
  const [query, setQuery] = useState('');

  const canResumeSimple =
    progress.lastSection === SIMPLE_TUTORIAL_ID &&
    !progress.completedSections.includes(SIMPLE_TUTORIAL_ID);
  const canResumeFull = Boolean(
    progress.lastSection &&
      FULL_TUTORIAL_SECTIONS.includes(progress.lastSection) &&
      !progress.completedFull
  );
  const hits = useMemo(() => searchHits(query), [query]);
  const contextIds = CONTEXT_SECTIONS[route] ?? [];

  useEffect(() => {
    if (view === 'closed' || view === 'tour') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (view === 'skip-confirm') keepTutorial();
      else if (view === 'welcome') maybeLater();
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, close, keepTutorial, maybeLater]);

  if (view === 'closed' || view === 'tour') return null;

  if (view === 'welcome') {
    return (
      <div className="synapse-tutorial-dialog-layer" role="presentation">
        <div
          className="synapse-tutorial-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <h2 id={titleId}>Welcome to Synapse</h2>
          <p>
            A short tour of Music Paths, tracks, and play — seven steps. The full
            walkthrough stays under Help (?).
          </p>
          <div className="synapse-tutorial-actions">
            <button type="button" className="synapse-btn synapse-btn-play" onClick={() => startSimple()}>
              Start Tour
            </button>
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={maybeLater}>
              Maybe Later
            </button>
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={askSkip}>
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'skip-confirm') {
    return (
      <div className="synapse-tutorial-dialog-layer" role="presentation">
        <div
          className="synapse-tutorial-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <h2 id={titleId}>Skip the tutorial?</h2>
          <p>You can reopen it anytime using the ? button in the header.</p>
          <div className="synapse-tutorial-actions">
            <button type="button" className="synapse-btn synapse-btn-play" onClick={confirmSkip}>
              Skip
            </button>
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={keepTutorial}>
              Keep Tutorial
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'complete') {
    return (
      <div className="synapse-tutorial-dialog-layer" role="presentation">
        <div
          className="synapse-tutorial-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <h2 id={titleId}>{runKind === 'simple' ? 'That’s the loop.' : "You're ready."}</h2>
          <p>
            {runKind === 'simple'
              ? 'You have the Music Path essentials. The ? button opens the full tutorial when you want more detail.'
              : 'You now know the fundamentals of Synapse. Build something of your own and experiment with the Music Path system.'}
          </p>
          <div className="synapse-tutorial-actions">
            <button type="button" className="synapse-btn synapse-btn-play" onClick={close}>
              Start Building
            </button>
            {runKind === 'simple' ? (
              <button type="button" className="synapse-btn synapse-btn-ghost" onClick={openFullTutorial}>
                Open Full Tutorial
              </button>
            ) : (
              <button type="button" className="synapse-btn synapse-btn-ghost" onClick={openTopics}>
                Review Topics
              </button>
            )}
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={close}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'topics') {
    return (
      <div className="synapse-tutorial-dialog-layer" role="presentation">
        <div
          className="synapse-tutorial-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <h2 id={titleId}>Tutorial</h2>
          <input
            className="synapse-tutorial-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tutorials..."
            aria-label="Search tutorials"
          />
          {hits.length > 0 ? (
            <div className="synapse-tutorial-group">
              <h3>Search</h3>
              {hits.slice(0, 12).map((hit) => (
                <button
                  key={`${hit.section.id}-${hit.label}`}
                  type="button"
                  className="synapse-tutorial-hit"
                  onClick={() => startSection(hit.section.id)}
                >
                  {hit.label}
                </button>
              ))}
            </div>
          ) : null}
          {TUTORIAL_GROUPS.map((group) => (
            <div key={group.id} className="synapse-tutorial-group">
              <h3>{group.label}</h3>
              {group.sectionIds.map((id) => {
                const section = getSection(id);
                if (!section) return null;
                const done = progress.completedSections.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`synapse-tutorial-topic${done ? ' is-done' : ''}`}
                    onClick={() => startSection(id)}
                  >
                    {section.title}
                    {done ? ' · done' : ''}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="synapse-tutorial-actions">
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={() => useTutorialStore.getState().openMenu()}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="synapse-tutorial-dialog-layer" role="presentation">
      <div
        className="synapse-tutorial-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId}>Synapse Tutorial</h2>
        <p>
          Quick start is seven steps. The full tutorial covers node types, branches,
          themes, and the rest of the editor.
        </p>
        {progress.completedFull ? (
          <p className="synapse-tutorial-praise">Tutorial complete</p>
        ) : null}
        {contextIds.length > 0 ? (
          <div className="synapse-tutorial-context">
            <p className="synapse-tutorial-kicker">On this page</p>
            {contextIds.map((id) => {
              const section = getSection(id);
              if (!section) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="synapse-tutorial-topic"
                  onClick={() => startSection(id)}
                >
                  {section.title}
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="synapse-tutorial-actions">
          {canResumeFull ? (
            <button
              type="button"
              className="synapse-btn synapse-btn-play"
              onClick={() => startFull(true)}
            >
              Continue Tutorial
            </button>
          ) : (
            <button type="button" className="synapse-btn synapse-btn-play" onClick={() => startFull()}>
              Start Full Tutorial
            </button>
          )}
          {canResumeSimple ? (
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={() => startSimple(true)}>
              Continue Quick Start
            </button>
          ) : (
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={() => startSimple()}>
              Quick Start
            </button>
          )}
          <button type="button" className="synapse-btn synapse-btn-ghost" onClick={openTopics}>
            {progress.completedFull || canResumeFull ? 'Review Topics' : 'Choose a Topic'}
          </button>
          <button type="button" className="synapse-btn synapse-btn-ghost" onClick={askSkip}>
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
