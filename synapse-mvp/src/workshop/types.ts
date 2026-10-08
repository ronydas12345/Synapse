export type WorkshopVisibility = 'private' | 'unlisted' | 'public';
export type WorkshopStatus = 'active' | 'pending' | 'rejected' | 'removed';
export type WorkshopTab = 'home' | 'new' | 'featured' | 'search' | 'saved';
export type WorkshopKind = 'playlist' | 'theme';
export type WorkshopBrowseKind = WorkshopKind | 'all' | 'user';

export const WORKSHOP_BROWSE_OPTIONS: { id: WorkshopBrowseKind; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'playlist', label: 'Playlists' },
  { id: 'theme', label: 'Themes' },
  { id: 'user', label: 'Users' },
];
export type ReportReason = 'spam' | 'abuse' | 'overlay' | 'copyright' | 'other';

export interface WorkshopPayload {
  name?: string;
  nodes: unknown[];
  edges: unknown[];
  portalPolicy?: unknown;
}

export interface WorkshopCard {
  id: string;
  shareCode: string;
  creatorUid: string;
  creatorUsername: string;
  creatorDisplayName: string;
  title: string;
  description: string;
  kind: WorkshopKind;
  tags: string[];
  featured: boolean;
  likeCount: number;
  saveCount: number;
  remixCount: number;
  commentCount: number;
  likesEnabled: boolean;
  commentsEnabled: boolean;
  savesEnabled: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  visibility: WorkshopVisibility;
}

import type { SynapseTheme } from '../theme/types';

export interface WorkshopCreation extends WorkshopCard {
  status: WorkshopStatus;
  remixOf: string | null;
  sourcePathId: string;
  payload: WorkshopPayload;
  theme: SynapseTheme | null;
}

export interface WorkshopReport {
  id: string;
  creationId: string;
  reporterUid: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewerUid: string;
  createdAt: string | null;
}
