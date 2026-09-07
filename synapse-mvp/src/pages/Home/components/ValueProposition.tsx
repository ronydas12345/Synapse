import PathDemo from './PathDemo';
import Reveal from './Reveal';

export default function ValueProposition() {
  return (
    <section className="synapse-mkt-section" id="value" aria-labelledby="value-title">
      <Reveal>
        <p className="synapse-mkt-kicker">The idea</p>
        <h2 id="value-title">Music doesn&apos;t have to be a straight line.</h2>
        <p className="synapse-mkt-lead">
          A playlist is a fixed sequence. Synapse is a Music Path: you draw the
          rules for what can happen next, then press play. The graph decides.
        </p>
        <div className="synapse-mkt-triple">
          <article>
            <PathDemo scene="build" label="A start node connected to a track node." />
            <h3>Build</h3>
            <p>Create a visual Music Path by connecting nodes on the canvas.</p>
          </article>
          <article>
            <PathDemo
              scene="control"
              label="A conditional, randomizer, and transition highlighted on the path."
            />
            <h3>Control</h3>
            <p>
              Use conditions, randomization, transitions, and playback rules to
              control what happens next.
            </p>
          </article>
          <article>
            <PathDemo
              scene="experience"
              animate
              label="The full path with a playback marker showing a dynamic listen."
            />
            <h3>Experience</h3>
            <p>Let the resulting system dynamically determine the listening experience.</p>
          </article>
        </div>
      </Reveal>
    </section>
  );
}
