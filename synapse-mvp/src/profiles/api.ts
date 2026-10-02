import { supabase, isMissingSchema, isSchemaCacheError, throwIfError } from '../supabase/client';
import {
  localPublicPreviewCreators,
  mergePublicCreators,
} from './previewCatalog';

export interface PublicCreator {
  uid: string;
  username: string;
  displayName: string;
  photoUrl: string;
  bio: string;
  equippedDecoration: string;
  featuredBadge: string;
  followerCount: number;
  shareCode: string;
  followsEnabled: boolean;
  savesEnabled: boolean;
  visibility: 'public' | 'unlisted' | 'private';
  createdAt: string | null;
}

function mapCreator(row: Record<string, unknown>): PublicCreator {
  const vis = row.visibility;
  return {
    uid: str(row.uid),
    username: str(row.username),
    displayName: str(row.display_name ?? row.displayName),
    photoUrl: str(row.photo_url ?? row.photoUrl),
    bio: str(row.bio),
    equippedDecoration: str(row.equipped_decoration ?? row.equippedDecoration) || 'default',
    featuredBadge: str(row.featured_badge ?? row.featuredBadge),
    followerCount: Number(row.follower_count ?? row.followerCount) || 0,
    shareCode: str(row.share_id ?? row.shareId ?? row.share_code ?? row.shareCode),
    followsEnabled: row.follows_enabled !== false && row.followsEnabled !== false,
    savesEnabled: row.saves_enabled !== false && row.savesEnabled !== false,
    visibility:
      vis === 'public' || vis === 'unlisted' || vis === 'private' ? vis : 'private',
    createdAt:
      typeof row.created_at === 'string'
        ? row.created_at
        : typeof row.createdAt === 'string'
          ? row.createdAt
          : null,
  };
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function readPublicCreator(
  username: string
): Promise<PublicCreator | null> {
  const { data, error } = await supabase.rpc('get_creator', { p_id: username });
  if (isMissingSchema(error)) {
    const fallback = await supabase
      .from('creator_public')
      .select('*')
      .or(`username.eq.${username},share_id.eq.${username},share_code.eq.${username}`)
      .maybeSingle();
    if (isMissingSchema(fallback.error)) return null;
    throwIfError(fallback.error);
    if (!fallback.data) return null;
    return mapCreator(fallback.data as Record<string, unknown>);
  }
  throwIfError(error);
  if (!data || typeof data !== 'object') return null;
  return mapCreator(data as Record<string, unknown>);
}

export async function readPublicCreatorsByUids(uids: string[]): Promise<PublicCreator[]> {
  const ids = [...new Set(uids.map((id) => id.trim()).filter(Boolean))].slice(0, 60);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('creator_public').select('*').in('uid', ids);
  if (isMissingSchema(error)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapCreator(row as Record<string, unknown>));
}

export async function readOwnCreator(uid: string): Promise<PublicCreator | null> {
  const { data, error } = await supabase
    .from('creator_public')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();
  if (isMissingSchema(error)) return null;
  throwIfError(error);
  if (!data) return null;
  return mapCreator(data as Record<string, unknown>);
}

export async function followCreator(uid: string): Promise<void> {
  const { error } = await supabase.rpc('follow_creator', { p_uid: uid });
  throwIfError(error);
}

export async function unfollowCreator(uid: string): Promise<void> {
  const { error } = await supabase.rpc('unfollow_creator', { p_uid: uid });
  throwIfError(error);
}

export async function isFollowing(followeeUid: string, followerUid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee_uid')
    .eq('follower_uid', followerUid)
    .eq('followee_uid', followeeUid)
    .maybeSingle();
  if (isMissingSchema(error)) return false;
  throwIfError(error);
  return Boolean(data);
}

export async function isCreatorSaved(creatorUid: string, viewerUid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('creator_saves')
    .select('creator_uid')
    .eq('uid', viewerUid)
    .eq('creator_uid', creatorUid)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function toggleCreatorSave(uid: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_creator_save', { p_uid: uid });
  throwIfError(error);
  return data === true;
}

export async function listSavedCreators(): Promise<PublicCreator[]> {
  const { data, error } = await supabase.rpc('list_saved_creators');
  if (isMissingSchema(error)) return [];
  throwIfError(error);
  if (!Array.isArray(data)) return [];
  return data.map((row) => mapCreator(row as Record<string, unknown>));
}

export async function listPublicCreators(
  query = '',
  order: 'followers' | 'new' = 'followers'
): Promise<PublicCreator[]> {
  const local = localPublicPreviewCreators().filter((creator) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      creator.username.includes(needle) ||
      creator.displayName.toLowerCase().includes(needle)
    );
  });
  const cleaned = query
    .trim()
    .replace(/[^a-zA-Z0-9_ -]/g, '')
    .replace(/\s+/g, '%')
    .slice(0, 80);
  const rpc = await supabase.rpc('list_public_creators', {
    p_query: query.trim().slice(0, 80),
    p_order: order,
  });
  if (!rpc.error && Array.isArray(rpc.data)) {
    return mergePublicCreators(
      local,
      rpc.data.map((row) => mapCreator(row as Record<string, unknown>))
    );
  }
  if (rpc.error && !isMissingSchema(rpc.error) && !isSchemaCacheError(rpc.error)) {
    throwIfError(rpc.error);
  }
  let request = supabase
    .from('creator_public')
    .select('*')
    .eq('visibility', 'public')
    .limit(60);
  if (cleaned) {
    request = request.or(
      `username.ilike.%${cleaned}%,display_name.ilike.%${cleaned}%`
    );
  }
  request =
    order === 'new'
      ? request.order('created_at', { ascending: false })
      : request.order('follower_count', { ascending: false });
  const { data, error } = await request;
  if (isMissingSchema(error)) return local;
  throwIfError(error);
  return mergePublicCreators(
    local,
    ((data ?? []) as Record<string, unknown>[]).map((row) => mapCreator(row))
  );
}

export async function setProfileSocial(input: {
  followsEnabled: boolean;
  savesEnabled: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('set_profile_social', {
    p_follows: input.followsEnabled,
    p_saves: input.savesEnabled,
  });
  throwIfError(error);
}

export async function syncProfilePublicFields(input: {
  visibility: 'public' | 'unlisted' | 'private';
  bio: string;
}): Promise<void> {
  const bio = input.bio.slice(0, 500);
  const { error } = await supabase.rpc('set_profile_public', {
    p_visibility: input.visibility,
    p_bio: bio,
  });
  if (!error) return;
  const deniedRpc = /permission denied for function set_profile_public/i.test(
    error.message || ''
  );
  if (isSchemaCacheError(error) || isMissingSchema(error) || deniedRpc) {
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (!uid) throw new Error('Not signed in');
    const fallback = await supabase
      .from('profiles')
      .update({
        visibility: input.visibility,
        bio,
      })
      .eq('uid', uid);
    if (fallback.error && /column .* does not exist/i.test(fallback.error.message)) {
      throwIfError(error);
    }
    throwIfError(fallback.error);
    return;
  }
  throwIfError(error);
}
