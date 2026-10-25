import { PathLink } from '../app/AppLink';
import { publicProfilePath } from '../app/routes';
import BadgeStrip from '../badges/BadgeStrip';
import { badgeDef } from '../badges/catalog';
import DecorationFrame from '../decorations/DecorationFrame';
import { nameplateClass } from '../decorations/catalog';
import { profileIdentity } from '../profiles/identity';
import type { WorkshopComment } from './api';

export default function CommentCard({
  comment,
  canDelete,
  busy,
  onDelete,
}: {
  comment: WorkshopComment;
  canDelete: boolean;
  busy: boolean;
  onDelete: () => void;
}) {
  const identity = profileIdentity(comment.displayName, comment.username);
  const initial = (identity.title.slice(0, 1) || '?').toUpperCase();
  const href = comment.username ? publicProfilePath(comment.username) : '';
  const featured = comment.featuredBadge;
  const badges =
    comment.badges.length > 0
      ? comment.badges
      : featured && badgeDef(featured)
        ? [{ id: featured, awardedAt: null, def: badgeDef(featured)! }]
        : [];

  return (
    <li className="synapse-workshop-comment">
      <div className="synapse-workshop-comment-head">
        <DecorationFrame
          id={comment.equippedDecoration}
          className="synapse-workshop-comment-deco"
        >
          {href ? (
            <PathLink href={href} className="synapse-workshop-comment-avatar">
              {comment.photoUrl ? (
                <img src={comment.photoUrl} alt="" width={44} height={44} />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
            </PathLink>
          ) : comment.photoUrl ? (
            <img src={comment.photoUrl} alt="" width={44} height={44} />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </DecorationFrame>
        <div className="synapse-workshop-comment-copy">
          <div className="synapse-workshop-comment-name-row">
            {href ? (
              <PathLink
                href={href}
                className={`synapse-workshop-comment-name ${nameplateClass(comment.equippedDecoration)}`.trim()}
              >
                {identity.title}
              </PathLink>
            ) : (
              <span
                className={`synapse-workshop-comment-name ${nameplateClass(comment.equippedDecoration)}`.trim()}
              >
                {identity.title}
              </span>
            )}
            {badges.length ? (
              <BadgeStrip badges={badges} featuredId={featured} compact />
            ) : null}
          </div>
          {identity.handle ? (
            <p className="synapse-workshop-handle">{identity.handle}</p>
          ) : null}
          {comment.createdAt ? (
            <p className="synapse-profile-muted synapse-workshop-comment-time">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>
      <p className="synapse-workshop-comment-body">{comment.body}</p>
      {canDelete ? (
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={busy}
          onClick={onDelete}
        >
          Delete
        </button>
      ) : null}
    </li>
  );
}
