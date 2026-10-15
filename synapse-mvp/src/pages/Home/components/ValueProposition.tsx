import PathDemo from './PathDemo';
import Reveal from './Reveal';

export default function ValueProposition() {
  return (
    <section className="synapse-mkt-section" id="value" aria-labelledby="value-title">
      <Reveal>
        <h2 id="value-title">A playlist is a list. A Music Path is a graph.</h2>
        <p className="synapse-mkt-lead">
          You draw what can happen next. Playback follows the connections.
        </p>
        <div className="synapse-mkt-triple">
          <article>
            <PathDemo scene="build" label="A start node connected to a track node." />
            <h3>Build</h3>
            <p>Drop nodes on the canvas and connect them.</p>
          </article>
          <article>
            <PathDemo
              scene="control"
              label="A conditional, randomizer, and transition highlighted on the path."
            />
            <h3>Branch</h3>
            <p>Conditions, randomizers, and transitions pick the next step.</p>
          </article>
          <article>
            <PathDemo
              scene="experience"
              animate
              label="The full path with a playback marker."
            />
            <h3>Play</h3>
            <p>Press play. The path chooses the next song.</p>
          </article>
        </div>
      </Reveal>
    </section>
  );
}
