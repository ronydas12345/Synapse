import { PathLink } from '../app/AppLink';
import { FeaturedBadgeMark } from '../badges/BadgeStrip';
import DecorationFrame from '../decorations/DecorationFrame';
import { publicProfilePath } from '../app/routes';
import type { PublicCreator } from '../profiles/api';
import { profileIdentity } from '../profiles/identity';

export default function CreatorCard({ creator }: { creator: PublicCreator }) {
  const href = publicProfilePath(creator.username || creator.shareCode);
  const identity = profileIdentity(creator.displayName, creator.username);
  const initial = identity.title.slice(0, 1).toUpperCase() || '@';
  return (
    <article className="synapse-mkt-workshop-card synapse-workshop-card" data-kind="profile">
      <PathLink href={href} className="synapse-workshop-card-link">
        <div className="synapse-workshop-identity">
          <DecorationFrame id={creator.equippedDecoration} className="synapse-workshop-deco">
            {creator.photoUrl ? (
              <img src={creator.photoUrl} alt="" width={52} height={52} />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </DecorationFrame>
          <div>
            <p className="synapse-mkt-status">Profile</p>
            <h3>{identity.title}</h3>
            {identity.handle ? <p className="synapse-workshop-handle">{identity.handle}</p> : null}
          </div>
        </div>
        {creator.bio ? <p>{creator.bio}</p> : null}
      </PathLink>
      <p className="synapse-workshop-meta">
        {creator.featuredBadge ? <FeaturedBadgeMark id={creator.featuredBadge} /> : null}
        <span>
          {creator.followerCount} follower{creator.followerCount === 1 ? '' : 's'}
        </span>
      </p>
    </article>
  );
}
