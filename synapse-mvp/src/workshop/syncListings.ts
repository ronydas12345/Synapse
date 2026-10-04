import { asPathVisibility } from '../playlists/library';
import { usePathStore } from '../store';
import { listOwnWorkshop } from './api';

export async function syncOwnPlaylistListings(): Promise<void> {
  const rows = await listOwnWorkshop();
  const sync = usePathStore.getState().syncWorkshopListing;
  for (const row of rows) {
    if (row.kind !== 'playlist') continue;
    sync(row.id, asPathVisibility(row.visibility), row.sourcePathId || undefined);
  }
}
