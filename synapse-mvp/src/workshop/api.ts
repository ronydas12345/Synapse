import { supabase, isMissingSchema, isSchemaCacheError, throwIfError } from '../supabase/client';
import { workshopItemPath } from '../app/routes';
import { parseTheme } from '../theme/parseTheme';
import { builtinThemePublishError } from '../theme/isPresetTheme';
import type { SynapseTheme } from '../theme/types';
import type {
  ReportReason,
  WorkshopCard,
  WorkshopCreation,
  WorkshopKind,
  WorkshopPayload,
  WorkshopStatus,
  WorkshopTab,
  WorkshopVisibility,
} from './types';
import { sanitizeTagIds } from './tags';

const CARD_COLUMNS = '*';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function shareCodeOf(row: Record<string, unknown>): string {
  return str(row.share_code || row.shareCode || row.share_id || row.shareId);
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

function kindOf(value: unknown): WorkshopKind {
  return value === 'theme' ? 'theme' : 'playlist';
}

function mapCard(row: Record<string, unknown>): WorkshopCard {
  const id = str(row.id);
  const shareCode = shareCodeOf(row);
  const kind = kindOf(row.kind);
  return {
    id,
    shareCode,
    creatorUid: str(row.creator_uid || row.creatorUid),
    creatorUsername: str(row.creator_username || row.creatorUsername),
    creatorDisplayName: str(row.creator_display_name || row.creatorDisplayName),
    title: str(row.title),
    description: str(row.description),
    kind,
    tags: sanitizeTagIds(kind, row.tags),
    featured: row.featured === true,
    likeCount: num(row.like_count ?? row.likeCount),
    saveCount: num(row.save_count ?? row.saveCount),
    remixCount: num(row.remix_count ?? row.remixCount),
    commentCount: num(row.comment_count ?? row.commentCount),
    likesEnabled: row.likes_enabled !== false && row.likesEnabled !== false,
    commentsEnabled: row.comments_enabled !== false && row.commentsEnabled !== false,
    savesEnabled: row.saves_enabled !== false && row.savesEnabled !== false,
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    visibility: visibilityOf(row.visibility),
  };
}

function mapCreation(row: Record<string, unknown>): WorkshopCreation {
  const card = mapCard(row);
  return {
    ...card,
    status: statusOf(row.status),
    remixOf: typeof row.remix_of === 'string' ? row.remix_of : null,
    sourcePathId: str(row.source_path_id),
    payload: payloadOf(row.payload),
    theme: card.kind === 'theme' ? parseTheme(row.payload) : null,
  };
}

export async function listWorkshop(
  tab: WorkshopTab,
  query = '',
  filters: { kind?: WorkshopKind | 'all'; tags?: string[] } = {}
): Promise<WorkshopCard[]> {
  if (tab === 'saved') return listSavedCreations();
  const kind = filters.kind && filters.kind !== 'all' ? filters.kind : '';
  const tags = Array.isArray(filters.tags) ? filters.tags.filter(Boolean) : [];
  const q = query.trim();
  if (tab === 'search' || kind || tags.length) {
    let { data, error } = await supabase.rpc('search_workshop', {
      p_query: tab === 'search' ? q : '',
      p_kind: kind,
      p_tags: tags,
    });
    if (isSchemaCacheError(error)) {
      const retry = await supabase.rpc('search_workshop', {
        p_query: tab === 'search' ? q : '',
      });
      data = retry.data;
      error = retry.error;
    }
    if (!isMissingSchema(error)) {
      throwIfError(error);
      const mapped = ((data ?? []) as Record<string, unknown>[]).map((row) =>
        mapCard(row)
      );
      return tab === 'featured' ? mapped.filter((card) => card.featured) : mapped;
    }
  }
  let request = supabase
    .from('workshop_creations')
    .select(CARD_COLUMNS)
    .eq('visibility', 'public')
    .eq('status', 'active')
    .limit(60);

  const cleaned = q
    .replace(/[^a-zA-Z0-9_ -]/g, '')
    .replace(/\s+/g, '%')
    .slice(0, 80);
  if (kind) request = request.eq('kind', kind);
  if (tags.length) request = request.overlaps('tags', tags);
  if (tab === 'featured') {
    request = request.eq('featured', true).order('featured_at', { ascending: false });
  } else if (tab === 'search' && cleaned) {
    request = request
      .or(
        `title.ilike.%${cleaned}%,description.ilike.%${cleaned}%,creator_username.ilike.%${cleaned}%,creator_display_name.ilike.%${cleaned}%`
      )
      .order('published_at', { ascending: false });
  } else {
    request = request.order('published_at', { ascending: false });
  }

  const { data, error } = await request;
  if (isMissingSchema(error)) return [];
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
  if (isMissingSchema(error)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapCard(row as Record<string, unknown>));
}

export async function listOwnWorkshop(): Promise<WorkshopCreation[]> {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('workshop_creations')
    .select(`${CARD_COLUMNS}`)
    .eq('creator_uid', uid)
    .order('updated_at', { ascending: false })
    .limit(80);
  if (isMissingSchema(error)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapCreation(row as Record<string, unknown>));
}

export async function getWorkshopCreation(
  id: string
): Promise<WorkshopCreation | null> {
  const { data, error } = await supabase.rpc('get_workshop_creation', { p_id: id });
  if (isMissingSchema(error)) return null;
  throwIfError(error);
  if (!data || typeof data !== 'object') return null;
  return mapCreation(data as Record<string, unknown>);
}

export async function publishWorkshopCreation(input: {
  sourcePathId: string;
  title: string;
  description: string;
  visibility: WorkshopVisibility;
  payload: WorkshopPayload | Record<string, unknown>;
  remixOf?: string | null;
  kind?: WorkshopKind;
  tags?: string[];
}): Promise<string> {
  const kind = input.kind === 'theme' ? 'theme' : 'playlist';
  if (kind === 'theme') {
    const parsed = parseTheme(input.payload);
    if (!parsed) throw new Error('Theme payload is invalid');
    const blocked = builtinThemePublishError(parsed);
    if (blocked) throw new Error(blocked);
  }
  const tags = sanitizeTagIds(kind, input.tags);
  const base = {
    p_source_path_id: input.sourcePathId,
    p_title: input.title,
    p_description: input.description,
    p_visibility: input.visibility,
    p_payload: input.payload,
    p_remix_of: input.remixOf ?? null,
  };
  let { data, error } = await supabase.rpc('publish_workshop_creation', {
    ...base,
    p_kind: kind,
    p_tags: tags,
  });
  if (isSchemaCacheError(error)) {
    const retry = await supabase.rpc('publish_workshop_creation', base);
    data = retry.data;
    error = retry.error;
    if (!error && tags.length && data) {
      const tagged = await supabase.rpc('set_workshop_tags', {
        p_id: String(data),
        p_tags: tags,
      });
      if (tagged.error && !isSchemaCacheError(tagged.error)) throwIfError(tagged.error);
    }
  }
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
  kind: WorkshopKind;
  theme: SynapseTheme | null;
}> {
  const { data, error } = await supabase.rpc('remix_workshop_creation', { p_id: id });
  throwIfError(error);
  const row = (data || {}) as Record<string, unknown>;
  const kind = kindOf(row.kind);
  return {
    title: str(row.title) || 'Remix',
    payload: payloadOf(row.payload),
    remixOf: str(row.remixOf || row.id),
    kind,
    theme: kind === 'theme' ? parseTheme(row.payload) : null,
  };
}

export async function setWorkshopTags(id: string, tags: string[]): Promise<string[]> {
  const { data, error } = await supabase.rpc('set_workshop_tags', {
    p_id: id,
    p_tags: tags,
  });
  throwIfError(error);
  return Array.isArray(data)
    ? data.filter((item): item is string => typeof item === 'string').slice(0, 8)
    : [];
}

export async function staffRemoveWorkshopTag(id: string, tag: string): Promise<void> {
  const { error } = await supabase.rpc('staff_remove_workshop_tag', {
    p_id: id,
    p_tag: tag,
  });
  throwIfError(error);
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
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (data ?? []).map((row) => mapCreation(row as Record<string, unknown>));
}

export interface WorkshopComment {
  id: string;
  uid: string;
  username: string;
  body: string;
  createdAt: string | null;
}

export async function listWorkshopComments(id: string): Promise<WorkshopComment[]> {
  const { data, error } = await supabase.rpc('list_workshop_comments', { p_id: id });
  if (isMissingSchema(error)) return [];
  throwIfError(error);
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: str(item.id),
      uid: str(item.uid),
      username: str(item.username),
      body: str(item.body),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : null,
    };
  });
}

export async function addWorkshopComment(id: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('add_workshop_comment', {
    p_id: id,
    p_body: body,
  });
  throwIfError(error);
}

export async function deleteWorkshopComment(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_workshop_comment', { p_id: id });
  throwIfError(error);
}

export async function setCreationSocial(
  id: string,
  likesEnabled: boolean,
  commentsEnabled: boolean,
  savesEnabled: boolean
): Promise<void> {
  const { error } = await supabase.rpc('set_creation_social', {
    p_id: id,
    p_likes: likesEnabled,
    p_comments: commentsEnabled,
    p_saves: savesEnabled,
  });
  throwIfError(error);
}

export async function listSavedCreations(): Promise<WorkshopCard[]> {
  let { data, error } = await supabase.rpc('list_saved_workshop');
  if (isMissingSchema(error)) {
    const retry = await supabase.rpc('list_saved_creations');
    data = retry.data;
    error = retry.error;
    if (isMissingSchema(error)) return [];
  }
  throwIfError(error);
  if (!Array.isArray(data)) return [];
  return data.map((row) => mapCard(row as Record<string, unknown>));
}

export async function resolveShare(ref: string): Promise<{
  kind: 'playlist' | 'user';
  id: string;
  shareId: string;
  username: string;
  path: string;
} | null> {
  const { data, error } = await supabase.rpc('resolve_share', { p_ref: ref.trim() });
  if (!isMissingSchema(error)) {
    throwIfError(error);
    if (data && typeof data === 'object') {
      const row = data as Record<string, unknown>;
      const kind = row.kind === 'user' ? 'user' : row.kind === 'playlist' ? 'playlist' : null;
      if (kind && str(row.path)) {
        return {
          kind,
          id: str(row.id),
          shareId: str(row.shareId || row.share_id || row.shareCode || row.share_code),
          username: str(row.username),
          path: str(row.path),
        };
      }
    }
  }
  const creation = await getWorkshopCreation(ref);
  if (creation) {
    const shareId = creation.shareCode || creation.id;
    return {
      kind: 'playlist',
      id: creation.id,
      shareId,
      username: creation.creatorUsername,
      path: workshopItemPath(shareId),
    };
  }
  return null;
}
