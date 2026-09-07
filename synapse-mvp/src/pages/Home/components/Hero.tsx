import { AppLink } from '../../../app/AppLink';
import PathDemo from './PathDemo';

export default function Hero() {
  return (
    <section className="synapse-mkt-hero" aria-labelledby="hero-title">
      <div className="synapse-mkt-hero-copy">
        <p className="synapse-mkt-kicker">Visual music sequencing for YouTube</p>
        <h1 id="hero-title">Build your music path.</h1>
        <p className="synapse-mkt-lead">
          Synapse turns music playback into a visual, interactive system. Connect
          songs, conditions, transitions, randomizers, and more to create a
          listening experience that follows your rules.
        </p>
        <div className="synapse-mkt-actions">
          <AppLink to="edit" className="synapse-btn synapse-btn-play">
            Open Synapse
          </AppLink>
          <AppLink to="workshop" className="synapse-btn synapse-btn-ghost">
            Explore the Workshop
          </AppLink>
        </div>
      </div>
      <div className="synapse-mkt-hero-viz">
        <PathDemo
          scene="hero"
          animate
          label="Demonstration of a Synapse music path: Start connects to a Track, then a Conditional that branches to tracks, a transition, and a randomizer. A playback marker travels the active route."
        />
      </div>
    </section>
  );
}
