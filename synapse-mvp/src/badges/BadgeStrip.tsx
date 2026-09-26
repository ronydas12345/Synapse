import type { EarnedBadge } from './api';
import { badgeDef } from './catalog';

export default function BadgeStrip({
  badges,
  featuredId,
  compact = false,
}: {
  badges: EarnedBadge[];
  featuredId?: string;
  compact?: boolean;
}) {
  if (badges.length === 0) {
    return compact ? null : (
      <p className="synapse-settings-lead">No badges earned yet.</p>
    );
  }
  const featured = featuredId ? badges.find((badge) => badge.id === featuredId) : null;
  const rest = featured ? badges.filter((badge) => badge.id !== featured.id) : badges;
  const shown = compact ? [featured, ...rest].filter(Boolean).slice(0, 4) : [featured, ...rest];
  return (
    <ul className={`synapse-badge-strip${compact ? ' is-compact' : ''}`}>
      {shown.filter((badge): badge is EarnedBadge => Boolean(badge)).map((badge) => (
        <li
          key={badge.id}
          className={`synapse-badge${badge.id === featuredId ? ' is-featured' : ''}`}
          title={badge.def.description}
        >
          <span className="synapse-badge-name">{badge.def.name}</span>
          {compact ? null : (
            <span className="synapse-badge-copy">{badge.def.description}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function FeaturedBadgeMark({ id }: { id: string }) {
  const def = badgeDef(id);
  if (!def) return null;
  return (
    <span className="synapse-badge is-inline" title={def.description}>
      {def.name}
    </span>
  );
}
