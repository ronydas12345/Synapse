import Reveal from './Reveal';

const FEATURES = [
  {
    title: 'Visual Music Paths',
    body: 'Build playback systems on a canvas instead of managing a long, brittle playlist.',
    status: 'Available',
  },
  {
    title: 'Conditional playback',
    body: 'Branch with weighted random or time of day. Weather, calendar date, and other conditions are planned.',
    status: 'Available',
  },
  {
    title: 'Randomization',
    body: 'Sequence, weighted random, and play-count limits. Controlled pools instead of a shuffled bag.',
    status: 'Available',
  },
  {
    title: 'Transitions',
    body: 'Insert silence, a custom audio clip, or a YouTube clip between tracks.',
    status: 'Available',
  },
  {
    title: 'Styles & themes',
    body: 'Preset and custom themes: colors, fonts, and chrome. The same path can look entirely different.',
    status: 'Available',
  },
  {
    title: 'Overlays',
    body: 'Images, GIFs, and animated effects on the canvas. Planned — not in this release.',
    status: 'Planned',
  },
  {
    title: 'Workshop',
    body: 'Discover and share paths, themes, and visual assets. Preview only — publishing is not live.',
    status: 'Coming soon',
  },
] as const;

export default function Features() {
  return (
    <section className="synapse-mkt-section" id="features" aria-labelledby="features-title">
      <Reveal>
        <p className="synapse-mkt-kicker">Features</p>
        <h2 id="features-title">Everything you need to build your perfect listening system.</h2>
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
