import docs from '../../DOCS.md?raw';
import { AppLink } from '../app/AppLink';
import { docsToc, renderMarkdownBody } from './changelogMarkdown';
import HelpNav from './chrome/HelpNav';
import './docs.css';

export default function DocsPage() {
  const toc = docsToc(docs);

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-docs">
      <header className="synapse-docs-hero">
        <h1>Documentation</h1>
        <p className="synapse-mkt-lead">
          Reference for Music Paths, the playback engine, file format, and public URLs.
        </p>
        <HelpNav here="docs" />
      </header>
      <div className="synapse-docs-layout">
        <nav className="synapse-docs-toc" aria-label="On this page">
          {toc.map((item) => (
            <AppLink key={item.id} to="docs" hash={item.id}>
              {item.label}
            </AppLink>
          ))}
        </nav>
        <article className="synapse-docs-body">{renderMarkdownBody(docs)}</article>
      </div>
    </main>
  );
}
