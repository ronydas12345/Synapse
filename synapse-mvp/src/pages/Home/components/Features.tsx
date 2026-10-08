import Reveal from './Reveal';

const FEATURES = [
  {
    title: 'Visual Music Paths',
    body: 'A canvas of nodes instead of a fixed playlist.',
    status: 'Available',
  },
  {
    title: 'Conditional playback',
    body: 'Branch on weighted random, time of day, weather, or day and date.',
    status: 'Available',
  },
  {
    title: 'Randomization',
    body: 'Sequence, weighted random, and play-count limits.',
    status: 'Available',
  },
  {
    title: 'Transitions',
    body: 'Silence, a custom audio clip, or a YouTube clip between tracks.',
    status: 'Available',
  },
  {
    title: 'Portals',
    body: 'Jump to another playlist. Wire in to leave, or out to receive — never both. Blue goes to a playlist beginning; purple lands on another playlist\'s portal.',
    status: 'Available',
  },
  {
    title: 'Styles & themes',
    body: 'Presets, custom themes, and Style nodes that change as a path plays.',
    status: 'Available',
  },
  {
    title: 'Overlays',
    body: 'Images, GIFs, and animated effects. Planned — not in this release.',
    status: 'Planned',
  },
  {
    title: 'Workshop',
    body: 'Publish Music Paths and themes. Browse, follow, and share by ID or link.',
    status: 'Available',
  },
] as const;

export default function Features() {
  return (
    <section className="synapse-mkt-section" id="features" aria-labelledby="features-title">
      <Reveal>
        <h2 id="features-title">Features</h2>
        <div className="synapse-mkt-cards">
          {FEATURES.map((f) => (
            <article key={f.title} className="synapse-mkt-card">
              <p className="synapse-mkt-status">{f.status}</p>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
