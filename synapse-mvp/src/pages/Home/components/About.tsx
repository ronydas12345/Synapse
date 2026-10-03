import { useState } from 'react';
import { Mail } from 'lucide-react';
import { PathLink } from '../../../app/AppLink';
import { publicProfilePath } from '../../../app/routes';
import { CREATOR } from '../../../site/content';
import Reveal from './Reveal';

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
      />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.07.07 0 0 0-.079.035c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.07.07 0 0 0-.079-.035A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.07.07 0 0 0 .084-.027c.462-.63.874-1.295 1.226-1.994a.07.07 0 0 0-.041-.098 13.1 13.1 0 0 1-1.872-.892.07.07 0 0 1-.007-.117c.126-.094.252-.192.373-.291a.07.07 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .079.009c.12.099.247.198.373.292a.07.07 0 0 1-.006.117 12.3 12.3 0 0 1-1.873.892.07.07 0 0 0-.041.099c.36.698.772 1.362 1.225 1.993a.07.07 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.07.07 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418"
      />
    </svg>
  );
}

function DiscordButton() {
  const username = CREATOR.discordUsername;
  const url = CREATOR.links.discord;
  const [copied, setCopied] = useState(false);

  if (url) {
    return (
      <a
        className="synapse-mkt-connect-btn synapse-mkt-connect-discord"
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        <DiscordMark />
        {username}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="synapse-mkt-connect-btn synapse-mkt-connect-discord"
      onClick={() => {
        void navigator.clipboard.writeText(username).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          },
          () => undefined
        );
      }}
    >
      <DiscordMark />
      {copied ? 'Copied' : username}
    </button>
  );
}

export default function About() {
  const profileHref = publicProfilePath(CREATOR.username);

  return (
    <section
      className="synapse-mkt-section synapse-mkt-about"
      id="about"
      aria-labelledby="about-title"
    >
      <Reveal>
        <p className="synapse-mkt-kicker">About</p>
        <h2 id="about-title">Music should feel more like something you explore.</h2>
        <div className="synapse-mkt-about-grid">
          <div className="synapse-mkt-avatar">
            <PathLink
              href={profileHref}
              className="synapse-mkt-avatar-link"
              title={`Open @${CREATOR.username}`}
            >
              <img src={CREATOR.photoSrc} alt={CREATOR.photoAlt} />
            </PathLink>
          </div>
          <div>
            <p>{CREATOR.bio}</p>
            <p>{CREATOR.why}</p>
            <p>{CREATOR.philosophy}</p>
            <div className="synapse-mkt-connect">
              <h3>Connect</h3>
              <div className="synapse-mkt-connect-row">
                <PathLink
                  href={profileHref}
                  className="synapse-mkt-connect-btn synapse-mkt-connect-profile"
                >
                  View profile
                </PathLink>
                <a
                  className="synapse-mkt-connect-btn synapse-mkt-connect-github"
                  href={CREATOR.links.github}
                  rel="noreferrer"
                  target="_blank"
                >
                  <GitHubMark />
                  GitHub
                </a>
                <DiscordButton />
                <a
                  className="synapse-mkt-connect-btn synapse-mkt-connect-email"
                  href={`mailto:${CREATOR.email}`}
                >
                  <Mail size={16} aria-hidden="true" />
                  {CREATOR.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
