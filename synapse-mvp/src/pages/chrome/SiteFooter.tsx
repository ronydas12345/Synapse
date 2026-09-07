import { AppLink } from '../../app/AppLink';
import SynapseMark from './SynapseMark';
import { CREATOR } from '../../site/content';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const links = CREATOR.links;

  return (
    <footer className="synapse-mkt-footer">
      <div className="synapse-mkt-footer-grid">
        <div className="synapse-mkt-footer-brand">
          <AppLink to="home" className="synapse-mkt-logo">
            <SynapseMark size={28} />
            <span className="synapse-brand">Synapse</span>
          </AppLink>
          <p>Visual music paths for YouTube.</p>
        </div>
        <div>
          <p className="synapse-mkt-foot-label">Product</p>
          <ul>
            <li>
              <AppLink to="home">Home</AppLink>
            </li>
            <li>
              <AppLink to="home" hash="features">
                Features
              </AppLink>
            </li>
            <li>
              <AppLink to="workshop">Workshop</AppLink>
            </li>
            <li>
              <AppLink to="home" hash="themes">
                Themes
              </AppLink>
            </li>
            <li>
              <AppLink to="pricing">Pricing</AppLink>
            </li>
            <li>
              <AppLink to="changelog">Changelog</AppLink>
            </li>
          </ul>
        </div>
        <div>
          <p className="synapse-mkt-foot-label">Resources</p>
          <ul>
            <li>
              <AppLink to="faq">Documentation</AppLink>
            </li>
            <li>
              <AppLink to="home" hash="how-it-works">
                Getting Started
              </AppLink>
            </li>
            <li>
              <AppLink to="workshop">Community</AppLink>
            </li>
            <li>
              <AppLink to="faq">FAQ</AppLink>
            </li>
            <li>
              {links.contact ? (
                <a href={links.contact}>Support</a>
              ) : (
                <AppLink to="home" hash="about">
                  Support
                </AppLink>
              )}
            </li>
          </ul>
        </div>
        <div>
          <p className="synapse-mkt-foot-label">Creator</p>
          <ul>
            <li>
              <AppLink to="home" hash="about">
                About
              </AppLink>
            </li>
            {links.contact ? (
              <li>
                <a href={links.contact}>Contact</a>
              </li>
            ) : null}
            {links.portfolio ? (
              <li>
                <a href={links.portfolio} rel="noreferrer" target="_blank">
                  Portfolio
                </a>
              </li>
            ) : null}
            {links.github ? (
              <li>
                <a href={links.github} rel="noreferrer" target="_blank">
                  GitHub
                </a>
              </li>
            ) : null}
            {links.linkedin ? (
              <li>
                <a href={links.linkedin} rel="noreferrer" target="_blank">
                  LinkedIn
                </a>
              </li>
            ) : null}
          </ul>
        </div>
        <div>
          <p className="synapse-mkt-foot-label">Legal</p>
          <ul>
            <li>
              <AppLink to="privacy">Privacy</AppLink>
            </li>
            <li>
              <AppLink to="terms">Terms</AppLink>
            </li>
            <li>
              <AppLink to="cookies">Cookie settings</AppLink>
            </li>
          </ul>
        </div>
      </div>
      <p className="synapse-mkt-footer-bottom">
        © {year} Synapse. All rights reserved.
      </p>
    </footer>
  );
}
