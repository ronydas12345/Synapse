import { AppLink } from '../../../app/AppLink';
import { WORKSHOP_EXAMPLES } from '../../../site/content';
import PathDemo from './PathDemo';
import Reveal from './Reveal';

export default function WorkshopPreview({ full = false }: { full?: boolean }) {
  return (
    <section
      className="synapse-mkt-section"
      id="workshop"
      aria-labelledby="workshop-title"
    >
      <Reveal>
        <p className="synapse-mkt-kicker">Workshop</p>
        <h2 id="workshop-title">Build it. Share it. Discover something new.</h2>
        <p className="synapse-mkt-lead">
          Workshop is not live. These cards are product examples of how shared
          paths and themes will look — not community posts, likes, or real
          creator accounts.
        </p>
        <div className="synapse-mkt-workshop-row">
          {WORKSHOP_EXAMPLES.map((card) => (
            <article key={card.name} className="synapse-mkt-workshop-card">
              <div className="synapse-mkt-workshop-preview" aria-hidden="true">
                {card.kind === 'Theme' ? (
                  <p className="synapse-mkt-workshop-swatch">{card.name}</p>
                ) : (
                  <PathDemo scene="build" label="Example music path thumbnail" />
                )}
              </div>
              <p className="synapse-mkt-status">Example</p>
              <h3>{card.name}</h3>
              <p>
                {card.kind} · {card.creator}
              </p>
              <p className="synapse-mkt-tags">{card.tags.join(' · ')}</p>
            </article>
          ))}
        </div>
        {!full ? (
          <p className="synapse-mkt-actions">
            <AppLink to="workshop" className="synapse-btn synapse-btn-ghost">
              Explore Workshop →
            </AppLink>
          </p>
        ) : (
          <p className="synapse-mkt-lead">
            Publishing, search, likes, and browsing other people&apos;s work will
            live here. Nothing is uploaded from this preview.
          </p>
        )}
      </Reveal>
    </section>
  );
}
