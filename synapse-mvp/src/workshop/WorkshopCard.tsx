import { PathLink } from '../app/AppLink';
import { publicProfilePath, workshopItemPath } from '../app/routes';
import { FeaturedBadgeMark } from '../badges/BadgeStrip';
import DecorationFrame from '../decorations/DecorationFrame';
import type { PublicCreator } from '../profiles/api';
import { profileIdentity } from '../profiles/identity';
import TagChips from './TagChips';
import { creationUploadedAt, formatUploadedAt } from './tiles';
import type { WorkshopCard } from './types';

export default function WorkshopCard({
  card,
  author,
  featuredBadge,
}: {
  card: WorkshopCard;
  author?: PublicCreator | null;
  featuredBadge?: string;
}) {
  const href = workshopItemPath(card.shareCode || card.id);
  const username = author?.username || card.creatorUsername;
  const displayName = author?.displayName || card.creatorDisplayName;
  const identity = profileIdentity(displayName, username);
  const badge = author?.featuredBadge || featuredBadge || '';
  const photo = author?.photoUrl || '';
  const initial = (identity.title || card.title).slice(0, 1).toUpperCase() || '?';
  const uploaded = formatUploadedAt(creationUploadedAt(card));
  return (
    <article
      className="synapse-mkt-workshop-card synapse-workshop-card"
      data-kind={card.kind === 'theme' ? 'theme' : 'playlist'}
    >
      <PathLink href={href} className="synapse-workshop-card-link">
        <div className="synapse-workshop-identity">
          <DecorationFrame id={author?.equippedDecoration} className="synapse-workshop-deco">
            {photo ? (
              <img src={photo} alt="" width={52} height={52} />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </DecorationFrame>
          <div>
            <p className="synapse-mkt-status">
              {card.featured
                ? 'Featured'
                : card.kind === 'theme'
                  ? 'Theme'
                  : card.visibility === 'unlisted'
                    ? 'Unlisted'
                    : 'Playlist'}
            </p>
            <h3>{card.title}</h3>
          </div>
        </div>
        <p>
          {card.description ||
            (card.kind === 'theme' ? 'A published theme.' : 'A published Music Path.')}
        </p>
      </PathLink>
      <p className="synapse-workshop-meta">
        {username ? (
          <PathLink href={publicProfilePath(username)}>
            {identity.handle || `@${username}`}
          </PathLink>
        ) : (
          <span>{identity.title}</span>
        )}
        {badge ? <FeaturedBadgeMark id={badge} /> : null}
      </p>
      <TagChips kind={card.kind} ids={card.tags} />
      <p className="synapse-mkt-tags">
        {card.likeCount} likes · {card.saveCount} saves · {card.remixCount} remixes
        {card.commentCount ? ` · ${card.commentCount} comments` : ''}
      </p>
      {uploaded ? <p className="synapse-workshop-uploaded">Uploaded {uploaded}</p> : null}
    </article>
  );
}
