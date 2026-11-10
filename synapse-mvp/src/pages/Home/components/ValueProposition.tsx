import { useState } from 'react';
import PathDemo, { type PathScene } from './PathDemo';
import Reveal from './Reveal';

const IDEAS: {
  scene: PathScene;
  title: string;
  body: string;
  label: string;
  animate?: boolean;
}[] = [
  {
    scene: 'build',
    title: 'Build',
    body: 'Drop nodes onto the canvas and connect them.',
    label: 'A start node connected to a track node.',
  },
  {
    scene: 'control',
    title: 'Branch',
    body: 'Conditions, randomizers, and transitions determine what happens next.',
    label: 'A conditional, randomizer, and transition highlighted on the path.',
  },
  {
    scene: 'experience',
    title: 'Play',
    body: 'Press Play. The path chooses the next song.',
    label: 'The full path with a playback marker.',
    animate: true,
  },
];

export default function ValueProposition() {
  const [idea, setIdea] = useState(0);
  const current = IDEAS[idea];

  return (
    <section className="synapse-mkt-section" id="value" aria-labelledby="value-title">
      <h2 id="value-title">A playlist is a list. A Music Path is a graph.</h2>
      <p className="synapse-mkt-lead">
        You draw what can happen next. Playback follows the connections.
      </p>
      <Reveal>
        <div className="synapse-mkt-value">
          <div className="synapse-mkt-value-picks" role="tablist" aria-label="How a music path works">
            {IDEAS.map((item, i) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={i === idea}
                id={`value-tab-${i}`}
                aria-controls="value-panel"
                className={i === idea ? 'is-active' : ''}
                onClick={() => setIdea(i)}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </button>
            ))}
          </div>
          <div
            id="value-panel"
            role="tabpanel"
            aria-labelledby={`value-tab-${idea}`}
            className="synapse-mkt-value-panel"
          >
            <PathDemo
              scene={current.scene}
              animate={Boolean(current.animate)}
              label={current.label}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
