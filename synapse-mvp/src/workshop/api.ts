import { supabase, throwIfError } from '../supabase/client';
import type {
  ReportReason,
  WorkshopCard,
  WorkshopCreation,
  WorkshopPayload,
  WorkshopStatus,
  WorkshopTab,
  WorkshopVisibility,
} from './types';

const CARD_COLUMNS =
  'id, creator_uid, creator_username, creator_display_name, title, description, featured, like_count, save_count, remix_count, published_at, created_at, visibility';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function visibilityOf(value: unknown): WorkshopVisibility {
  if (value === 'public' || value === 'unlisted' || value === 'private') return value;
  return 'private';
}

function statusOf(value: unknown): WorkshopStatus {
  if (value === 'pending' || value === 'rejected' || value === 'removed') return value;
  return 'active';
}

function payloadOf(raw: unknown): WorkshopPayload {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    nodes: Array.isArray(value.nodes) ? value.nodes : [],
    edges: Array.isArray(value.edges) ? value.edges : [],
  };
}

function mapCard(row: Record<string, unknown>): WorkshopCard {
  return {
    id: str(row.id),
    creatorUid: str(row.creator_uid),
    creatorUsername: str(row.creator_username),
    creatorDisplayName: str(row.creator_display_name),
    title: str(row.title),
    description: str(row.description),
    featured: row.featured === true,
    likeCount: num(row.like_count),
    saveCount: num(row.save_count),
    remixCount: num(row.remix_count),
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    visibility: visibilityOf(row.visibility),
  };
}

function mapCreation(row: Record<string, unknown>): WorkshopCreation {
  return {
    ...mapCard(row),
    status: statusOf(row.status),
    remixOf: typeof row.remix_of === 'string' ? row.remix_of : null,
    sourcePathId: str(row.source_path_id),
    payload: payloadOf(row.payload),
  };
}

export async function listWorkshop(
  tab: WorkshopTab,
  query = ''
): Promise<WorkshopCard[]> {
  let request = supabase
    .from('workshop_creations')
    .select(CARD_COLUMNS)
    .eq('visibility', 'public')
    .eq('status', 'active')
    .limit(60);

  const q = query
    .trim()
    .replace(/[^a-zA-Z0-9_ ]/g, '')
    .replace(/\s+/g, '%')
    .slice(0, 80);
  if (tab === 'featured') {
    request = request.eq('featured', true).order('featured_at', { ascending: false });
  } else if (tab === 'search' && q) {
    request = request
      .or(
        `title.ilike.%${q}%,description.ilike.%${q}%,creator_username.ilike.%${q}%,creator_display_name.ilike.%${q}%`
      )
      .order('published_at', { ascending: false });
  } else {
    request = request.order('published_at', { ascending: false });
  }

  const { data, error } = await request;
  if (error && /does not exist|schema cache/i.test(error.message)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapCard(row as Record<string, unknown>));
}

export async function listCreatorWorkshop(uid: string): Promise<WorkshopCard[]> {
  const { data, error } = await supabase
    .from('workshop_creations')
    .select(CARD_COLUMNS)
    .eq('creator_uid', uid)
    .eq('visibility', 'public')
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(60);
  if (error && /does not exist|schema cache/i.test(error.message)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapCard(row as Record<string, unknown>));
}

export async function listOwnWorkshop(): Promise<WorkshopCreation[]> {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('workshop_creations')
    .select(`${CARD_COLUMNS}, status, remix_of, source_path_id, payload`)
    .eq('creator_uid', uid)
    .order('updated_at', { ascending: false })
    .limit(80);
  if (error && /does not exist|schema cache/i.test(error.message)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapCreation(row as Record<string, unknown>));
}

export async function getWorkshopCreation(
  id: string
): Promise<WorkshopCreation | null> {
  const { data, error } = await supabase.rpc('get_workshop_creation', { p_id: id });
  if (error && /does not exist|schema cache/i.test(error.message)) return null;
  throwIfError(error);
  if (!data || typeof data !== 'object') return null;
  return mapCreation(data as Record<string, unknown>);
}

export async function publishWorkshopCreation(input: {
  sourcePathId: string;
  title: string;
  description: string;
  visibility: WorkshopVisibility;
  payload: WorkshopPayload;
  remixOf?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('publish_workshop_creation', {
    p_source_path_id: input.sourcePathId,
    p_title: input.title,
    p_description: input.description,
    p_visibility: input.visibility,
    p_payload: input.payload,
    p_remix_of: input.remixOf ?? null,
  });
  throwIfError(error);
  return String(data);
}

export async function setWorkshopVisibility(
  id: string,
  visibility: WorkshopVisibility
): Promise<void> {
  const { error } = await supabase.rpc('set_workshop_visibility', {
    p_id: id,
    p_visibility: visibility,
  });
  throwIfError(error);
}

export async function toggleWorkshopLike(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_workshop_like', { p_id: id });
  throwIfError(error);
  return data === true;
}

export async function toggleWorkshopSave(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_workshop_save', { p_id: id });
  throwIfError(error);
  return data === true;
}

export async function remixWorkshopCreation(id: string): Promise<{
  title: string;
  payload: WorkshopPayload;
  remixOf: string;
}> {
  const { data, error } = await supabase.rpc('remix_workshop_creation', { p_id: id });
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  return {
    title: str(row.title) || 'Remix',
    payload: payloadOf(row.payload),
    remixOf: str(row.remixOf || row.id),
  };
}

export async function reportWorkshopCreation(
  id: string,
  reason: ReportReason,
  details: string
): Promise<void> {
  const { error } = await supabase.rpc('report_workshop_creation', {
    p_id: id,
    p_reason: reason,
    p_details: details,
  });
  throwIfError(error);
}

export async function likedCreationIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase
    .from('workshop_likes')
    .select('creation_id')
    .in('creation_id', ids);
  if (error) return new Set();
  return new Set((data ?? []).map((row) => str(row.creation_id)));
}

export async function savedCreationIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase
    .from('workshop_saves')
    .select('creation_id')
    .in('creation_id', ids);
  if (error) return new Set();
  return new Set((data ?? []).map((row) => str(row.creation_id)));
}

export async function setWorkshopFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_workshop_featured', {
    p_id: id,
    p_featured: featured,
  });
  throwIfError(error);
}

export async function setWorkshopStatus(
  id: string,
  status: WorkshopStatus,
  note = ''
): Promise<void> {
  const { error } = await supabase.rpc('set_workshop_status', {
    p_id: id,
    p_status: status,
    p_note: note,
  });
  throwIfError(error);
}

export async function listWorkshopReports(): Promise<
  {
    id: string;
    creationId: string;
    reporterUid: string;
    reason: string;
    details: string;
    status: string;
    createdAt: string | null;
  }[]
> {
  const { data, error } = await supabase
    .from('workshop_reports')
    .select('id, creation_id, reporter_uid, reason, details, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (data ?? []).map((row) => ({
    id: str(row.id),
    creationId: str(row.creation_id),
    reporterUid: str(row.reporter_uid),
    reason: str(row.reason),
    details: str(row.details),
    status: str(row.status),
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
  }));
}

export async function reviewWorkshopReport(
  id: string,
  status: 'reviewed' | 'dismissed'
): Promise<void> {
  const { error } = await supabase.rpc('review_workshop_report', {
    p_id: id,
    p_status: status,
  });
  throwIfError(error);
}

export async function listStaffWorkshop(): Promise<WorkshopCreation[]> {
  const { data, error } = await supabase
    .from('workshop_creations')
    .select(`${CARD_COLUMNS}, status, remix_of, source_path_id`)
    .order('updated_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (data ?? []).map((row) => mapCreation(row as Record<string, unknown>));
}
