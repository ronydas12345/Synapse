import { useState, type KeyboardEvent } from 'react';
import PathDemo, { type PathScene } from './PathDemo';
import Reveal from './Reveal';

const STEPS: { scene: PathScene; title: string; body: string }[] = [
  {
    scene: 'step1',
    title: 'Start with a song',
    body: 'Drag a track node onto the canvas and select the music you want to use.',
  },
  {
    scene: 'step2',
    title: 'Build the path',
    body: 'Connect nodes to determine what plays next. Create sequences, branches, and random paths.',
  },
  {
    scene: 'step3',
    title: 'Add personality',
    body: 'Add transitions, style nodes, and configure how your playlist behaves.',
  },
  {
    scene: 'step4',
    title: 'Press Play',
    body: 'Start playback and let your graph determine the next song.',
  },
];

export default function HowItWorks() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function onStepKey(event: KeyboardEvent<HTMLDivElement>) {
    let next = step;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      next = Math.min(STEPS.length - 1, step + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      next = Math.max(0, step - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      next = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      next = STEPS.length - 1;
    } else {
      return;
    }
    if (next === step) return;
    setStep(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`#how-tab-${next}`)
      ?.focus();
  }

  return (
    <section
      className="synapse-mkt-section synapse-mkt-how"
      id="how-it-works"
      aria-labelledby="how-title"
    >
      <h2 id="how-title">How it works</h2>
      <Reveal>
        <div className="synapse-mkt-how-grid">
          <div
            className="synapse-mkt-how-steps"
            role="tablist"
            aria-label="How Synapse works"
            onKeyDown={onStepKey}
          >
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === step}
                id={`how-tab-${i}`}
                aria-controls="how-panel"
                tabIndex={i === step ? 0 : -1}
                className={i === step ? 'is-active' : ''}
                onClick={() => setStep(i)}
              >
                <span>0{i + 1}</span>
                <strong>{s.title}</strong>
                <em>{s.body}</em>
              </button>
            ))}
          </div>
          <div
            id="how-panel"
            role="tabpanel"
            aria-labelledby={`how-tab-${step}`}
            className="synapse-mkt-how-panel"
          >
            <PathDemo
              scene={current.scene}
              animate={step === 3}
              label={current.body}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
