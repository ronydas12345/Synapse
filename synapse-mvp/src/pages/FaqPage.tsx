import { FAQ_ITEMS } from '../site/content';

export default function FaqPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>FAQ</h1>
      <p className="synapse-mkt-lead">Short answers for the current release.</p>
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
