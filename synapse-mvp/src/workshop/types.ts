export type WorkshopVisibility = 'private' | 'unlisted' | 'public';
export type WorkshopStatus = 'active' | 'pending' | 'rejected' | 'removed';
export type WorkshopTab = 'home' | 'new' | 'featured' | 'search';
export type ReportReason = 'spam' | 'abuse' | 'overlay' | 'copyright' | 'other';

export interface WorkshopPayload {
  name?: string;
  nodes: unknown[];
  edges: unknown[];
}

export interface WorkshopCard {
  id: string;
  creatorUid: string;
  creatorUsername: string;
  creatorDisplayName: string;
  title: string;
  description: string;
  featured: boolean;
  likeCount: number;
  saveCount: number;
  remixCount: number;
  publishedAt: string | null;
  createdAt: string | null;
  visibility: WorkshopVisibility;
}

export interface WorkshopCreation extends WorkshopCard {
  status: WorkshopStatus;
  remixOf: string | null;
  sourcePathId: string;
  payload: WorkshopPayload;
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
