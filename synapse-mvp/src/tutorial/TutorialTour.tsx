import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../site/motion';
import {
  FULL_TUTORIAL_SECTIONS,
  getSection,
  sectionIndexInFull,
} from './tutorialCatalog';
import { measureTarget, paddedRect, placeWindow, rectsClose, scrollTutorialTargetIntoView, watchTutorialTarget, type SpotlightRect } from './placement';
import { useTutorialStore } from './tutorialStore';

export default function TutorialTour() {
  const view = useTutorialStore((s) => s.view);
  const runKind = useTutorialStore((s) => s.runKind);
  const sectionId = useTutorialStore((s) => s.sectionId);
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const praise = useTutorialStore((s) => s.praise);
  const next = useTutorialStore((s) => s.next);
  const back = useTutorialStore((s) => s.back);
  const skipSection = useTutorialStore((s) => s.skipSection);
  const exitTour = useTutorialStore((s) => s.exitTour);
  const reduced = usePrefersReducedMotion();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [vw, setVw] = useState(() =>
    typeof window === 'undefined' ? 1200 : window.innerWidth
  );
  const [vh, setVh] = useState(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight
  );

  const section = sectionId ? getSection(sectionId) : undefined;
  const step = section?.steps[stepIndex];

  useEffect(() => {
    if (view !== 'tour') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitTour();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, exitTour]);

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useLayoutEffect(() => {
    if (view !== 'tour' || !step) return;
    scrollTutorialTargetIntoView(step.target);
    setRect(measureTarget(step.target));
    const stop = watchTutorialTarget(step.target, (next) => {
      setRect((prev) => (rectsClose(prev, next) ? prev : next));
    });
    return stop;
  }, [view, step, sectionId, stepIndex]);

  const mobile = vw <= 720;
  const spot = useMemo(() => (rect ? paddedRect(rect) : null), [rect]);
  const pos = useMemo(
    () => placeWindow(spot, vw, vh, mobile),
    [spot, vw, vh, mobile]
  );

  if (view !== 'tour' || !section || !step) return null;

  const sectionN = runKind === 'full' ? sectionIndexInFull(section.id) + 1 : 0;
  const sectionTotal = FULL_TUTORIAL_SECTIONS.length;
  const instant = reduced ? ' is-instant' : '';

  return (
    <div className="synapse-tutorial-layer" aria-hidden={false}>
      {spot ? (
        <div
          className={`synapse-tutorial-spotlight${instant}`}
          style={{
            left: spot.left,
            top: spot.top,
            width: spot.width,
            height: spot.height,
          }}
        />
      ) : (
        <div
          className="synapse-tutorial-spotlight"
          style={{ left: 0, top: 0, width: 0, height: 0, opacity: 0 }}
        />
      )}
      <div
        className={`synapse-tutorial-window${instant}${pos.sheet ? ' is-sheet' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="synapse-tutorial-title"
        style={pos.sheet ? undefined : { left: pos.left, top: pos.top }}
      >
        <p className="synapse-tutorial-kicker">
          {runKind === 'full'
            ? `Section ${sectionN} of ${sectionTotal} · ${stepIndex + 1} / ${section.steps.length}`
            : `${section.title} · ${stepIndex + 1} / ${section.steps.length}`}
        </p>
        <h2 id="synapse-tutorial-title">{step.title}</h2>
        <p>{step.body}</p>
        {praise ? <p className="synapse-tutorial-praise">{praise}</p> : null}
        {step.type === 'action' && !praise ? (
          <p className="synapse-tutorial-kicker">Try it, then this continues — or press Next.</p>
        ) : null}
        <div className="synapse-tutorial-actions">
          <button type="button" className="synapse-btn synapse-btn-ghost" onClick={back}>
            Back
          </button>
          <button type="button" className="synapse-btn synapse-btn-play" onClick={next}>
            Next
          </button>
          <button type="button" className="synapse-btn synapse-btn-ghost" onClick={skipSection}>
            Skip Section
          </button>
          <button type="button" className="synapse-btn synapse-btn-ghost" onClick={exitTour}>
            Exit Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
