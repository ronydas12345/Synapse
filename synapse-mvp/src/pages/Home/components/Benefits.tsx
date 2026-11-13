import { Shuffle, SlidersHorizontal, Unlock } from 'lucide-react';
import type { ReactNode } from 'react';
import Reveal from './Reveal';

const BENEFITS: {
  title: string;
  body: string;
  icon: ReactNode;
  accent: 'teal' | 'warm' | 'ok';
}[] = [
  {
    title: 'Extreme Personalization',
    body: 'Build your listening experience around your preferences. Customize playback paths, conditions, themes, transitions, and how your music behaves.',
    icon: <SlidersHorizontal strokeWidth={1.75} />,
    accent: 'teal',
  },
  {
    title: 'Dynamic Playback',
    body: 'Go beyond a fixed playlist. Create branching paths, sequences, randomization, and conditional playback that changes what happens next.',
    icon: <Shuffle strokeWidth={1.75} />,
    accent: 'warm',
  },
  {
    title: 'A Powerful Free Tier',
    body: 'Create and use visual Music Paths without paying. Build playlists, configure playback, and explore the core Synapse experience for free.',
    icon: <Unlock strokeWidth={1.75} />,
    accent: 'ok',
  },
];

export default function Benefits() {
  return (
    <section
      className="synapse-mkt-section synapse-mkt-benefits"
      id="benefits"
      aria-labelledby="benefits-title"
    >
      <h2 id="benefits-title" className="synapse-sr-only">
        Why Synapse
      </h2>
      <Reveal>
        <div className="synapse-mkt-benefits-grid">
          {BENEFITS.map((item) => (
            <article
              key={item.title}
              className="synapse-mkt-card synapse-mkt-card-info synapse-mkt-benefit"
            >
              <div className="synapse-mkt-benefit-head">
                <span
                  className="synapse-mkt-benefit-icon"
                  data-accent={item.accent}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
