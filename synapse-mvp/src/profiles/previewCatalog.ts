import type { ProfileVisibility } from '../profile/types';
import type { PublicCreator } from './api';

export const VIS_PREVIEW_USERNAME = 'vis_preview';
export const VIS_PREVIEW_STORAGE_KEY = 'synapse_vis_preview';
export const VIS_PREVIEW_EVENT = 'synapse-vis-preview';

export function isVisPreview(username: string): boolean {
  return username.trim().toLowerCase() === VIS_PREVIEW_USERNAME;
}

export function readPreviewVisibility(): ProfileVisibility {
  if (typeof localStorage === 'undefined') return 'private';
  try {
    const value = localStorage.getItem(VIS_PREVIEW_STORAGE_KEY);
    if (value === 'public' || value === 'unlisted' || value === 'private') return value;
  } catch {
    /* ignore */
  }
  return 'private';
}

export function writePreviewVisibility(value: ProfileVisibility): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(VIS_PREVIEW_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VIS_PREVIEW_EVENT));
  }
}

export function visPreviewCreator(
  visibility = readPreviewVisibility()
): PublicCreator {
  return {
    uid: '00000000-0000-4000-a000-000000000003',
    username: VIS_PREVIEW_USERNAME,
    displayName: 'Visibility Preview',
    photoUrl: '',
    bio: 'Local test profile. Set Public to list this account in Workshop Users. Nothing here writes to the server.',
    equippedDecoration: 'default',
    featuredBadge: '',
    followerCount: 0,
    shareCode: 'visprevw01',
    followsEnabled: true,
    savesEnabled: true,
    visibility,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

export function localPublicPreviewCreators(): PublicCreator[] {
  const creator = visPreviewCreator();
  return creator.visibility === 'public' ? [creator] : [];
}

export function mergePublicCreators(
  local: PublicCreator[],
  server: PublicCreator[]
): PublicCreator[] {
  const seen = new Set(local.map((row) => row.username));
  return [...local, ...server.filter((row) => !seen.has(row.username))];
}
