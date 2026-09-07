import Reveal from './Reveal';

const CASES = [
  {
    title: 'Personal listening',
    body: 'Dynamic systems for everyday music. Morning → calmer tracks. Afternoon → energy. Evening → wind down. Time-of-day conditionals are live.',
  },
  {
    title: 'Mood-based listening',
    body: 'Branch between moods or genres with weighted random, so the mix can lean without locking you in.',
  },
  {
    title: 'Background music',
    body: 'Build paths meant to stay out of the way: study, game, work, relax, sleep — a pool that keeps going under your rules.',
  },
  {
    title: 'Dynamic playlists',
    body: 'Stop lining up every next song. Design the system once and let Synapse choose within it.',
  },
  {
    title: 'Community creations',
    body: 'Workshop will host paths and themes from other people. Sharing is not live yet; the preview on this site shows the shape of it.',
  },
] as const;

export default function UseCases() {
  return (
    <section className="synapse-mkt-section" id="solutions" aria-labelledby="solutions-title">
      <Reveal>
        <p className="synapse-mkt-kicker">Solutions</p>
        <h2 id="solutions-title">The same graph, different kinds of listening.</h2>
        <div className="synapse-mkt-cards synapse-mkt-cards-3">
          {CASES.map((c) => (
            <article key={c.title} className="synapse-mkt-card">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
