import changelog from '../../CHANGELOG.md?raw';
import { renderChangelogBody, splitChangelogVersions } from './changelogMarkdown';
import HelpNav from './chrome/HelpNav';

export default function ChangelogPage() {
  const versions = splitChangelogVersions(changelog).filter((version) => version.body.trim());

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Changelog</h1>
      <HelpNav here="changelog" />
      {versions.map((version) => (
        <article key={version.title} className="synapse-mkt-legal-block">
          <h2>{version.title}</h2>
          {renderChangelogBody(version.body)}
        </article>
      ))}
    </main>
  );
}
