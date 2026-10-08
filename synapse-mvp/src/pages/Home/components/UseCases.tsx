import Reveal from './Reveal';

const CASES = [
  {
    title: 'Everyday listening',
    body: 'Morning vs evening, weekends, rain. Time, weather, and day/date branches are live.',
  },
  {
    title: 'Moods and genres',
    body: 'Weighted random so the mix can lean without locking one lane.',
  },
  {
    title: 'Background',
    body: 'A pool that keeps going for study, work, or sleep.',
  },
  {
    title: 'Workshop',
    body: 'Public paths from other people. Publish, like, remix, follow.',
  },
  {
    title: 'Linked playlists',
    body: 'A Portal leaves one path and continues on another, at the start or at an entry portal.',
  },
] as const;

export default function UseCases() {
  return (
    <section className="synapse-mkt-section" id="solutions" aria-labelledby="solutions-title">
      <Reveal>
        <h2 id="solutions-title">Uses</h2>
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
