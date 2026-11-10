import Reveal from './Reveal';

const CASES = [
  {
    title: 'Personal listening',
    body: 'Morning, weekend, or rainy-day mixes using time, weather, and day/date branches.',
  },
  {
    title: 'Mood-based listening',
    body: 'Lean a mix toward a mood or genre with weighted random, without locking into one track.',
  },
  {
    title: 'Background music',
    body: 'Study, game, work, or sleep paths that keep going under your rules.',
  },
  {
    title: 'Dynamic playlists',
    body: 'Design the system once. Synapse chooses the next song within it.',
  },
  {
    title: 'Community creations',
    body: 'Browse public Music Paths, themes, and profiles in Workshop.',
  },
] as const;

export default function UseCases() {
  return (
    <section className="synapse-mkt-section" id="solutions" aria-labelledby="solutions-title">
      <h2 id="solutions-title">Uses</h2>
      <Reveal>
        <div className="synapse-mkt-cards synapse-mkt-cards-3">
          {CASES.map((c) => (
            <article key={c.title} className="synapse-mkt-card synapse-mkt-card-info">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
