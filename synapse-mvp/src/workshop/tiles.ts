import type { PublicCreator } from '../profiles/api';
import type { WorkshopCard } from './types';

export type WorkshopTile =
  | { type: 'creation'; card: WorkshopCard; uploadedAt: string | null }
  | { type: 'user'; creator: PublicCreator; uploadedAt: string | null };

export function uploadedAtMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export function creationUploadedAt(card: {
  publishedAt: string | null;
  createdAt: string | null;
}): string | null {
  return card.publishedAt || card.createdAt;
}

export function formatUploadedAt(iso: string | null | undefined): string | null {
  const ms = uploadedAtMs(iso);
  if (!ms) return null;
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function sortByUploadedAt<T>(items: T[], uploadedAt: (item: T) => string | null): T[] {
  return [...items].sort(
    (a, b) => uploadedAtMs(uploadedAt(b)) - uploadedAtMs(uploadedAt(a))
  );
}

export function mixWorkshopTiles(
  cards: WorkshopCard[],
  creators: PublicCreator[]
): WorkshopTile[] {
  const tiles: WorkshopTile[] = [
    ...cards.map((card) => ({
      type: 'creation' as const,
      card,
      uploadedAt: creationUploadedAt(card),
    })),
    ...creators.map((creator) => ({
      type: 'user' as const,
      creator,
      uploadedAt: creator.createdAt,
    })),
  ];
  return sortByUploadedAt(tiles, (tile) => tile.uploadedAt);
}
