import { AppLink } from '../../../app/AppLink';

export default function FinalCTA() {
  return (
    <section className="synapse-mkt-final" aria-labelledby="final-title">
      <h2 id="final-title">Your music. Your rules.</h2>
      <p>Build a Music Path and create a listening experience that changes with you.</p>
      <div className="synapse-mkt-actions">
        <AppLink to="edit" className="synapse-btn synapse-btn-play">
          Open Synapse
        </AppLink>
        <AppLink to="workshop" className="synapse-btn synapse-btn-ghost">
          Explore Workshop
        </AppLink>
      </div>
    </section>
  );
}
