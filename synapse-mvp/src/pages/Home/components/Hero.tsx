import { AppLink } from '../../../app/AppLink';
import OpenWorkspaceLink from '../../../components/OpenWorkspaceLink';
import { HERO_BANNER_SRC } from '../heroBanner';

export default function Hero() {
  return (
    <section
      className={`synapse-mkt-hero${HERO_BANNER_SRC ? ' has-banner' : ''}`}
      id="hero"
      aria-labelledby="hero-title"
    >
      <div className="synapse-mkt-hero-media" aria-hidden="true">
        {HERO_BANNER_SRC ? (
          <img
            src={HERO_BANNER_SRC}
            alt=""
            width={4096}
            height={1356}
            decoding="async"
            fetchPriority="high"
          />
        ) : null}
      </div>
      <div className="synapse-mkt-hero-inner">
        <div className="synapse-mkt-hero-copy">
          <p className="synapse-mkt-kicker">Music paths for YouTube</p>
          <h1 id="hero-title">Build your music path.</h1>
          <p className="synapse-mkt-lead">
            Connect tracks, conditions, randomizers, and transitions on a canvas.
            Playback follows the graph you draw — not a fixed list of songs.
          </p>
          <div className="synapse-mkt-actions">
            <OpenWorkspaceLink className="synapse-btn synapse-btn-play" />
            <AppLink to="workshop" className="synapse-btn synapse-btn-ghost">
              Explore Workshop
            </AppLink>
          </div>
          <p className="synapse-mkt-hero-note">
            Workshop is where you browse playlists, themes, and profiles other
            people have shared.
          </p>
        </div>
      </div>
    </section>
  );
}
