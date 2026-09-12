import changelog from '../../CHANGELOG.md?raw';
import { renderChangelogBody, splitChangelogVersions } from './changelogMarkdown';

export default function ChangelogPage() {
  const versions = splitChangelogVersions(changelog).slice(0, 8);

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Changelog</h1>
      <p className="synapse-mkt-lead">Notes from the Synapse app. Newest first.</p>
      {versions.map((version) => (
        <article key={version.title} className="synapse-mkt-legal-block">
          <h2>{version.title}</h2>
          {renderChangelogBody(version.body)}
        </article>
      ))}
    </main>
  );
}
