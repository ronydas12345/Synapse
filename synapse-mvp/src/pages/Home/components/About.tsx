import SynapseMark from '../../chrome/SynapseMark';
import { CREATOR } from '../../../site/content';
import Reveal from './Reveal';

export default function About() {
  const name = CREATOR.displayName.trim() || CREATOR.role;
  const links = [
    CREATOR.links.github && { href: CREATOR.links.github, label: 'GitHub' },
    CREATOR.links.portfolio && { href: CREATOR.links.portfolio, label: 'Portfolio' },
    CREATOR.links.linkedin && { href: CREATOR.links.linkedin, label: 'LinkedIn' },
    CREATOR.links.contact && { href: CREATOR.links.contact, label: 'Contact' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <section className="synapse-mkt-section synapse-mkt-about" id="about" aria-labelledby="about-title">
      <Reveal>
        <p className="synapse-mkt-kicker">About</p>
        <h2 id="about-title">Built by a music lover who wanted more control.</h2>
        <div className="synapse-mkt-about-grid">
          <div className="synapse-mkt-avatar">
            {CREATOR.photoSrc ? (
              <img src={CREATOR.photoSrc} alt={CREATOR.photoAlt} />
            ) : (
              <SynapseMark size={96} title="Synapse mark used as a placeholder avatar" />
            )}
          </div>
          <div>
            <p className="synapse-mkt-about-name">{name}</p>
            <p>{CREATOR.bio}</p>
            <p>{CREATOR.why}</p>
            <p>{CREATOR.philosophy}</p>
            {links.length > 0 ? (
              <p className="synapse-mkt-about-links">
                {links.map((l) => (
                  <a key={l.label} href={l.href} rel="noreferrer" target="_blank">
                    {l.label}
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
