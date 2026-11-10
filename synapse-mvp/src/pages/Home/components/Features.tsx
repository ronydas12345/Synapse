import Reveal from './Reveal';

const FEATURES = [
  {
    title: 'Visual Music Paths',
    body: 'Build playback systems on a canvas instead of managing a long, linear playlist.',
    status: 'Available',
  },
  {
    title: 'Conditional playback',
    body: 'Branch according to conditions such as time of day, local weather, or other available context.',
    status: 'Available',
  },
  {
    title: 'Randomization',
    body: 'Use sequences, weighted randomization, and playback-count limits to control how tracks are selected.',
    status: 'Available',
  },
  {
    title: 'Transitions',
    body: 'Insert silence, custom audio clips, or YouTube clips between tracks.',
    status: 'Available',
  },
  {
    title: 'Styles & themes',
    body: 'Preset and custom themes in Settings, plus Style nodes that change the look as a path plays.',
    status: 'Available',
  },
  {
    title: 'Overlays',
    body: 'Images, GIFs, and animated effects on the canvas. Not in this release.',
    status: 'Planned',
  },
  {
    title: 'Workshop',
    body: 'Discover and share Music Paths and themes. Publish from Settings, browse Workshop, and share public or unlisted items by ID or link.',
    status: 'Available',
  },
] as const;

export default function Features() {
  return (
    <section className="synapse-mkt-section" id="features" aria-labelledby="features-title">
      <h2 id="features-title">Features</h2>
      <Reveal>
        <div className="synapse-mkt-cards">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="synapse-mkt-card synapse-mkt-card-info"
              data-status={f.status.toLowerCase()}
            >
              <h3>{f.title}</h3>
              <p className="synapse-mkt-status">{f.status}</p>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
