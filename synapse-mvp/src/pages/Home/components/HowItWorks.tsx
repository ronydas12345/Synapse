import { useState } from 'react';
import PathDemo, { type PathScene } from './PathDemo';
import Reveal from './Reveal';

const STEPS: { scene: PathScene; title: string; body: string }[] = [
  {
    scene: 'step1',
    title: 'Start with a song',
    body: 'Drop a Track node and paste a YouTube URL or video ID.',
  },
  {
    scene: 'step2',
    title: 'Connect the path',
    body: 'Example: Start → Track → Conditional → Randomizer → Track.',
  },
  {
    scene: 'step3',
    title: 'Add rules',
    body: 'Transitions, Style nodes, Portals to other playlists, and the conditions you want. Overlays are planned.',
  },
  {
    scene: 'step4',
    title: 'Press play',
    body: 'Synapse follows the path.',
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
        <h2 id="how-title">How it works</h2>
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
