import { useEffect, useId } from 'react';
import { EDITOR_EXPERIENCE_OPTIONS } from '../editorExperience/config';
import { useOnboardingStore } from './onboardingStore';
import './onboarding.css';

function MiniGraph() {
  return (
    <svg className="synapse-onboarding-graph" viewBox="0 0 520 120" aria-hidden="true">
      <line className="is-flow" x1="70" y1="60" x2="190" y2="60" stroke="var(--accent)" strokeWidth="2" />
      <line className="is-flow" x1="250" y1="60" x2="330" y2="34" stroke="var(--accent)" strokeWidth="2" />
      <line className="is-flow" x1="250" y1="60" x2="330" y2="86" stroke="var(--accent)" strokeWidth="2" />
      <line className="is-flow" x1="390" y1="34" x2="460" y2="60" stroke="var(--edge-color, var(--border-strong))" strokeWidth="2" />
      <line className="is-flow" x1="390" y1="86" x2="460" y2="60" stroke="var(--edge-color, var(--border-strong))" strokeWidth="2" />
      <rect x="20" y="38" width="50" height="44" rx="8" fill="var(--bg-panel)" stroke="var(--accent)" />
      <rect x="190" y="38" width="60" height="44" rx="8" fill="var(--bg-panel)" stroke="var(--border-strong)" />
      <rect x="330" y="12" width="60" height="44" rx="8" fill="var(--bg-panel)" stroke="var(--border-strong)" />
      <rect x="330" y="64" width="60" height="44" rx="8" fill="var(--bg-panel)" stroke="var(--border-strong)" />
      <rect x="460" y="38" width="40" height="44" rx="8" fill="var(--bg-panel)" stroke="var(--border-strong)" />
      <text x="45" y="64" textAnchor="middle" fill="var(--text)" fontSize="9">Start</text>
      <text x="220" y="64" textAnchor="middle" fill="var(--text)" fontSize="9">Track</text>
      <text x="360" y="38" textAnchor="middle" fill="var(--text)" fontSize="9">A</text>
      <text x="360" y="90" textAnchor="middle" fill="var(--text)" fontSize="9">B</text>
      <text x="480" y="64" textAnchor="middle" fill="var(--text)" fontSize="9">End</text>
    </svg>
  );
}

export default function OnboardingFlow() {
  const open = useOnboardingStore((s) => s.open);
  const stage = useOnboardingStore((s) => s.stage);
  const intent = useOnboardingStore((s) => s.intent);
  const experience = useOnboardingStore((s) => s.experience);
  const skipToApp = useOnboardingStore((s) => s.skipToApp);
  const closeWithoutCompleting = useOnboardingStore((s) => s.closeWithoutCompleting);
  const setIntent = useOnboardingStore((s) => s.setIntent);
  const setExperience = useOnboardingStore((s) => s.setExperience);
  const next = useOnboardingStore((s) => s.next);
  const back = useOnboardingStore((s) => s.back);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeWithoutCompleting();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeWithoutCompleting]);

  if (!open) return null;

  const step =
    stage === 'welcome' ? 1 : stage === 'concept' ? 2 : stage === 'start-path' ? 3 : 4;

  return (
    <div className="synapse-tutorial-dialog-layer synapse-onboarding-layer" role="presentation">
      <div
        className="synapse-tutorial-dialog synapse-onboarding-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="synapse-onboarding-kicker">Welcome · {step} / 4</p>
        {stage === 'welcome' ? (
          <>
            <h2 id={titleId}>Welcome to Synapse</h2>
            <MiniGraph />
            <p>
              Music doesn’t have to be a straight line. Synapse lets you build playlists as
              interconnected paths, giving you control over how your music flows.
            </p>
            <div className="synapse-tutorial-actions">
              <button type="button" className="synapse-btn synapse-btn-play" onClick={next}>
                Get Started
              </button>
              <button type="button" className="synapse-btn synapse-btn-ghost" onClick={skipToApp}>
                Explore on My Own
              </button>
            </div>
          </>
        ) : null}
        {stage === 'concept' ? (
          <>
            <h2 id={titleId}>Build a path, not a list</h2>
            <MiniGraph />
            <p>
              Each node is a piece of your playlist. Connections decide what plays next. Instead of
              lining songs up, you draw a path that controls how music moves — including a Randomizer
              that can pick between tracks.
            </p>
            <div className="synapse-tutorial-actions">
              <button type="button" className="synapse-btn synapse-btn-ghost" onClick={back}>
                Back
              </button>
              <button type="button" className="synapse-btn synapse-btn-play" onClick={next}>
                Next
              </button>
            </div>
          </>
        ) : null}
        {stage === 'start-path' ? (
          <>
            <h2 id={titleId}>How do you want to start?</h2>
            <div className="synapse-onboarding-choices">
              <button
                type="button"
                className={`synapse-onboarding-choice${intent === 'quickstart' ? ' is-active' : ''}`}
                onClick={() => setIntent('quickstart')}
              >
                <strong>Build my first playlist</strong>
                <span>A short guided Quick Start. You make First Steps with your own songs.</span>
              </button>
              <button
                type="button"
                className={`synapse-onboarding-choice${intent === 'explore' ? ' is-active' : ''}`}
                onClick={() => setIntent('explore')}
              >
                <strong>Explore Synapse</strong>
                <span>Open the editor and look around. Quick Start stays in Help if you want it later.</span>
              </button>
              <button
                type="button"
                className={`synapse-onboarding-choice${intent === 'example' ? ' is-active' : ''}`}
                onClick={() => setIntent('example')}
              >
                <strong>Show me an example</strong>
                <span>Open a labeled example path with comments. It is not your first playlist.</span>
              </button>
            </div>
            <div className="synapse-tutorial-actions">
              <button type="button" className="synapse-btn synapse-btn-ghost" onClick={back}>
                Back
              </button>
            </div>
          </>
        ) : null}
        {stage === 'experience' ? (
          <>
            <h2 id={titleId}>Editor experience</h2>
            <p>
              This changes guidance and how dense the workspace feels, not what you can build. You can
              switch later from the control in the bottom-left corner.
            </p>
            <div className="synapse-onboarding-choices">
              {EDITOR_EXPERIENCE_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={`synapse-onboarding-choice${experience === option.mode ? ' is-active' : ''}`}
                  onClick={() => setExperience(option.mode)}
                >
                  <strong>{option.label}</strong>
                  <span>
                    {option.mode === 'basic'
                      ? 'More guidance, clearer explanations, and a less overwhelming interface.'
                      : option.mode === 'intermediate'
                        ? 'A balance between guidance and information density.'
                        : 'The full editor with minimal interruptions.'}
                  </span>
                </button>
              ))}
            </div>
            <div className="synapse-tutorial-actions">
              <button type="button" className="synapse-btn synapse-btn-ghost" onClick={back}>
                Back
              </button>
              <button type="button" className="synapse-btn synapse-btn-play" onClick={next}>
                Continue
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
