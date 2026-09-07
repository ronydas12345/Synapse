import changelog from '../../CHANGELOG.md?raw';

function renderChangelog(raw: string) {
  return raw
    .split(/^## /m)
    .slice(1)
    .filter(Boolean)
    .slice(0, 8)
    .map((block, i) => {
      const [titleLine, ...rest] = block.trim().split('\n');
      return (
        <article key={titleLine + i} className="synapse-mkt-legal-block">
          <h2>{titleLine}</h2>
          <pre>{rest.join('\n').trim()}</pre>
        </article>
      );
    });
}

export default function ChangelogPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Changelog</h1>
      <p className="synapse-mkt-lead">Notes from the Synapse app. Newest first.</p>
      {renderChangelog(changelog)}
    </main>
  );
}
