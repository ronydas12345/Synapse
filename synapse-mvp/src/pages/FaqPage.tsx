import { FAQ_ITEMS } from '../site/content';
import HelpNav from './chrome/HelpNav';

export default function FaqPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>FAQ</h1>
      <p className="synapse-mkt-lead">
        Short answers for the current release. Node types, the playback engine, and the{' '}
        <code>.synapse</code> file format are in the docs.
      </p>
      <HelpNav here="faq" />
      <dl className="synapse-mkt-faq">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q}>
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
