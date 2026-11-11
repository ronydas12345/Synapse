import Reveal from './Reveal';

const FEATURES = [
  {
    title: 'Visual Music Paths',
    body: 'Build playback systems on a canvas instead of managing a long, linear playlist.',
    status: 'Available',
  },
  {
    title: 'Conditional playback',
    body: 'Branch by time of day, local weather, day or date, or a live Choice the listener picks from named paths.',
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
  {
    title: 'Real-Time Collaboration & Version History',
    body: 'Build Music Paths together in real time. See collaborators\' changes as they happen, work on shared playlists, and revisit earlier versions with version history.',
    status: 'Planned · Pro',
  },
] as const;

function featureAvailability(status: string): 'available' | 'planned' {
  return status.toLowerCase().startsWith('planned') ? 'planned' : 'available';
}

export default function Features() {
  return (
    <section
      className="synapse-mkt-section synapse-mkt-features"
      id="features"
      aria-labelledby="features-title"
    >
      <h2 id="features-title">Features</h2>
      <Reveal>
        <div className="synapse-mkt-cards">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="synapse-mkt-card synapse-mkt-card-info"
              data-status={featureAvailability(f.status)}
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
