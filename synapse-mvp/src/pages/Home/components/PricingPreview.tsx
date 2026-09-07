import { AppLink } from '../../../app/AppLink';
import { PRICING } from '../../../site/content';
import Reveal from './Reveal';

export default function PricingPreview({ full = false }: { full?: boolean }) {
  return (
    <section className="synapse-mkt-section" id="pricing" aria-labelledby="pricing-title">
      <Reveal>
        <p className="synapse-mkt-kicker">Pricing</p>
        <h2 id="pricing-title">{full ? 'Plans' : 'Start free. Pro when it exists.'}</h2>
        <p className="synapse-mkt-lead">{PRICING.note}</p>
        <div className="synapse-mkt-pricing">
          <article className="synapse-mkt-price-card is-free">
            <h3>{PRICING.free.name}</h3>
            <p>{PRICING.free.summary}</p>
            <ul>
              {PRICING.free.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="synapse-mkt-price-card">
            <h3>{PRICING.pro.name}</h3>
            <p>{PRICING.pro.summary}</p>
            <ul>
              {PRICING.pro.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        {!full ? (
          <p className="synapse-mkt-actions">
            <AppLink to="pricing" className="synapse-btn synapse-btn-ghost">
              Compare Plans
            </AppLink>
          </p>
        ) : (
          <p className="synapse-mkt-actions">
            <AppLink to="edit" className="synapse-btn synapse-btn-play">
              Open Synapse
            </AppLink>
          </p>
        )}
      </Reveal>
    </section>
  );
}
