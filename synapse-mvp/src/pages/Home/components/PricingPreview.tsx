import OpenWorkspaceLink from '../../../components/OpenWorkspaceLink';
import { PRICING } from '../../../site/content';
import Reveal from './Reveal';

export default function PricingPreview({ full = false }: { full?: boolean }) {
  return (
    <section className="synapse-mkt-section" id="pricing" aria-labelledby="pricing-title" data-tutorial="pricing">
      <h2 id="pricing-title">Pricing</h2>
      <p className="synapse-mkt-lead">{PRICING.note}</p>
      <Reveal>
        <div className="synapse-mkt-pricing">
          <article className="synapse-mkt-price-card is-free synapse-mkt-card-info">
            <h3>{PRICING.free.name}</h3>
            <p>{PRICING.free.summary}</p>
            <ul>
              {PRICING.free.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="synapse-mkt-price-cta">
              <OpenWorkspaceLink className="synapse-btn synapse-btn-play" />
            </p>
          </article>
          <article className="synapse-mkt-price-card synapse-mkt-card-info" data-status="planned">
            <h3>{PRICING.pro.name}</h3>
            <p className="synapse-mkt-status">Planned</p>
            <p>{PRICING.pro.summary}</p>
            <ul>
              {PRICING.pro.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        {full ? (
          <p className="synapse-mkt-actions">
            <OpenWorkspaceLink className="synapse-btn synapse-btn-play" />
          </p>
        ) : null}
      </Reveal>
    </section>
  );
}
