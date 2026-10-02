import { useEffect, useState } from 'react';
import { PathLink } from '../app/AppLink';
import { publicProfilePath } from '../app/routes';
import { listSavedCreators, readPublicCreatorsByUids, type PublicCreator } from '../profiles/api';
import { listSavedCreations } from './api';
import type { WorkshopCard as Card } from './types';
import WorkshopCard from './WorkshopCard';

export default function SavedCollections({
  includeCreators = true,
}: {
  includeCreators?: boolean;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [creators, setCreators] = useState<PublicCreator[]>([]);
  const [authors, setAuthors] = useState<PublicCreator[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listSavedCreations(),
      includeCreators ? listSavedCreators() : Promise.resolve([]),
    ])
      .then(async ([nextCards, nextCreators]) => {
        if (cancelled) return;
        const byUid = new Map(nextCreators.map((creator) => [creator.uid, creator]));
        const missing = nextCards.map((card) => card.creatorUid).filter((uid) => uid && !byUid.has(uid));
        if (missing.length > 0) {
          for (const creator of await readPublicCreatorsByUids(missing)) byUid.set(creator.uid, creator);
        }
        if (cancelled) return;
        setCards(nextCards);
        setCreators(nextCreators);
        setAuthors([...byUid.values()]);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load saved items.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [includeCreators]);

  return (
    <div className="synapse-saved-collections">
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <h3 className="synapse-workshop-sub">Saved Workshop creations</h3>
      {cards.length === 0 ? (
        <p className="synapse-settings-lead">No saved Workshop creations yet.</p>
      ) : (
        <div className="synapse-mkt-workshop-row">
          {cards.map((card) => (
            <WorkshopCard
              key={card.id}
              card={card}
              author={
                authors.find((creator) => creator.uid === card.creatorUid) ||
                authors.find(
                  (creator) =>
                    creator.username &&
                    card.creatorUsername &&
                    creator.username.toLowerCase() === card.creatorUsername.toLowerCase()
                ) ||
                null
              }
            />
          ))}
        </div>
      )}
      {includeCreators ? (
        <>
          <h3 className="synapse-workshop-sub">Saved creators</h3>
          {creators.length === 0 ? (
            <p className="synapse-settings-lead">No saved creator profiles yet.</p>
          ) : (
            <ul className="synapse-saved-creators">
              {creators.map((creator) => (
                <li key={creator.uid}>
                  <PathLink href={publicProfilePath(creator.username || creator.shareCode)}>
                    @{creator.username || creator.shareCode}
                  </PathLink>
                  {creator.displayName ? ` · ${creator.displayName}` : ''}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
