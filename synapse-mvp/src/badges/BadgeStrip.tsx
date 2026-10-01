import type { EarnedBadge } from './api';
import { badgeClass, badgeDef } from './catalog';

function BadgeMark({ tier }: { tier: number }) {
  const gems = tier >= 5 ? 3 : tier >= 4 ? 2 : 1;
  return (
    <span className="synapse-badge-mark" aria-hidden="true">
      {Array.from({ length: gems }, (_, index) => (
        <span key={index} className="synapse-badge-gem" />
      ))}
    </span>
  );
}

export default function BadgeStrip({
  badges,
  featuredId,
  compact = false,
  onPick,
}: {
  badges: EarnedBadge[];
  featuredId?: string;
  compact?: boolean;
  onPick?: (id: string) => void;
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
      {shown.filter((badge): badge is EarnedBadge => Boolean(badge)).map((badge) => {
        const selected = badge.id === featuredId;
        const className = badgeClass(badge.id, selected ? 'is-featured' : '');
        const body = (
          <>
            <span className="synapse-badge-head">
              <BadgeMark tier={badge.def.tier} />
              <span className="synapse-badge-name">{badge.def.name}</span>
            </span>
            {compact ? null : (
              <span className="synapse-badge-copy">{badge.def.description}</span>
            )}
          </>
        );
        return (
          <li key={badge.id}>
            {onPick ? (
              <button
                type="button"
                className={className}
                title={
                  selected
                    ? `${badge.def.description} (featured — click to clear)`
                    : `Feature ${badge.def.name}`
                }
                aria-pressed={selected}
                onClick={() => onPick(selected ? '' : badge.id)}
              >
                {body}
              </button>
            ) : (
              <div className={className} title={badge.def.description}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function FeaturedBadgeMark({ id }: { id: string }) {
  const def = badgeDef(id);
  if (!def) return null;
  return (
    <span className={`${badgeClass(id, 'is-inline')}`} title={def.description}>
      <BadgeMark tier={def.tier} />
      {def.name}
    </span>
  );
}
