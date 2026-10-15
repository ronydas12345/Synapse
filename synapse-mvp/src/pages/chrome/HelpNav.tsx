import { AppLink } from '../../app/AppLink';
import '../docs.css';

const ITEMS = [
  { to: 'docs' as const, label: 'Docs' },
  { to: 'faq' as const, label: 'FAQ' },
  { to: 'changelog' as const, label: 'Changelog' },
];

export default function HelpNav({ here }: { here: 'docs' | 'faq' | 'changelog' }) {
  return (
    <nav className="synapse-help-nav" aria-label="Reference">
      {ITEMS.map((item) => (
        <AppLink
          key={item.to}
          to={item.to}
          aria-current={here === item.to ? 'page' : undefined}
        >
          {item.label}
        </AppLink>
      ))}
    </nav>
  );
}
