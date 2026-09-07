import Reveal from './Reveal';

const PRINCIPLES = [
  {
    title: 'Creativity',
    body: 'Music should be something users can design, not just consume.',
  },
  {
    title: 'Control',
    body: 'Users should be able to define exactly how their music behaves.',
  },
  {
    title: 'Discovery',
    body: 'A system should still leave room for unexpected songs and combinations.',
  },
] as const;

export default function Philosophy() {
  return (
    <section className="synapse-mkt-section synapse-mkt-philosophy" aria-labelledby="philosophy-title">
      <Reveal>
        <h2 id="philosophy-title">Give listeners control without making them do all the work.</h2>
        <ol className="synapse-mkt-principles">
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
