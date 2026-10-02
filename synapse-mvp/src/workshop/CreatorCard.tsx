import { PathLink } from '../app/AppLink';
import { publicProfilePath } from '../app/routes';
import type { PublicCreator } from '../profiles/api';

export default function CreatorCard({ creator }: { creator: PublicCreator }) {
  const href = publicProfilePath(creator.username || creator.shareCode);
  return (
    <article className="synapse-mkt-workshop-card synapse-workshop-card">
      <PathLink href={href} className="synapse-workshop-card-link">
        <p className="synapse-mkt-status">User</p>
        <h3>{creator.displayName || creator.username || 'Creator'}</h3>
        <p>
          {creator.bio ||
            (creator.username ? `@${creator.username}` : 'A public Synapse profile.')}
        </p>
      </PathLink>
      <p className="synapse-workshop-meta">
        {creator.username ? (
          <PathLink href={href}>@{creator.username}</PathLink>
        ) : (
          <span>Creator</span>
        )}
      </p>
      <p className="synapse-mkt-tags">
        {creator.followerCount} follower{creator.followerCount === 1 ? '' : 's'}
      </p>
    </article>
  );
}
