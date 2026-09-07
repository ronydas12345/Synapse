import { useState } from 'react';
import PathDemo, { type PathScene } from './PathDemo';
import Reveal from './Reveal';

const STEPS: { scene: PathScene; title: string; body: string }[] = [
  {
    scene: 'step1',
    title: 'Start with a song',
    body: 'Drag a Track node onto the canvas and paste a YouTube URL or video ID.',
  },
  {
    scene: 'step2',
    title: 'Build the path',
    body: 'Connect songs and logic together. Example: Start → Track → Conditional → Randomizer → Track.',
  },
  {
    scene: 'step3',
    title: 'Add personality',
    body: 'Add transitions, a theme, and the rules you care about. Overlays are planned.',
  },
  {
    scene: 'step4',
    title: 'Press Play',
    body: 'Synapse follows the path and dynamically determines what plays next.',
  },
];

export default function HowItWorks() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <section
      className="synapse-mkt-section synapse-mkt-how"
      id="how-it-works"
      aria-labelledby="how-title"
    >
      <Reveal>
        <p className="synapse-mkt-kicker">How it works</p>
        <h2 id="how-title">Four steps from a blank canvas to a living mix.</h2>
        <div className="synapse-mkt-how-grid">
          <div className="synapse-mkt-how-steps" role="tablist" aria-label="How Synapse works">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === step}
                id={`how-tab-${i}`}
                aria-controls="how-panel"
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
