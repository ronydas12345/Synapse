import { PathLink } from '../app/AppLink';
import { publicProfilePath, workshopItemPath } from '../app/routes';
import { FeaturedBadgeMark } from '../badges/BadgeStrip';
import type { WorkshopCard } from './types';

export default function WorkshopCard({
  card,
  featuredBadge,
}: {
  card: WorkshopCard;
  featuredBadge?: string;
}) {
  return (
    <article className="synapse-mkt-workshop-card synapse-workshop-card">
      <PathLink href={workshopItemPath(card.id)} className="synapse-workshop-card-link">
        <p className="synapse-mkt-status">
          {card.featured ? 'Featured' : 'Workshop'}
        </p>
        <h3>{card.title}</h3>
        <p>{card.description || 'A published Music Path.'}</p>
      </PathLink>
      <p className="synapse-workshop-meta">
        {card.creatorUsername ? (
          <PathLink href={publicProfilePath(card.creatorUsername)}>
            @{card.creatorUsername}
          </PathLink>
        ) : (
          <span>{card.creatorDisplayName || 'Creator'}</span>
        )}
        {featuredBadge ? <FeaturedBadgeMark id={featuredBadge} /> : null}
      </p>
      <p className="synapse-mkt-tags">
        {card.likeCount} likes · {card.saveCount} saves · {card.remixCount} remixes
      </p>
    </article>
  );
}
