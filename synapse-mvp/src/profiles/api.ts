import { supabase, throwIfError } from '../supabase/client';

export interface PublicCreator {
  uid: string;
  username: string;
  displayName: string;
  photoUrl: string;
  bio: string;
  equippedDecoration: string;
  featuredBadge: string;
  followerCount: number;
  createdAt: string | null;
}

function mapCreator(row: {
  uid: string;
  username: string;
  display_name: string;
  photo_url: string;
  bio: string;
  equipped_decoration: string;
  featured_badge: string;
  follower_count: number;
  created_at: string | null;
}): PublicCreator {
  return {
    uid: row.uid,
    username: row.username,
    displayName: row.display_name,
    photoUrl: row.photo_url || '',
    bio: row.bio || '',
    equippedDecoration: row.equipped_decoration || 'default',
    featuredBadge: row.featured_badge || '',
    followerCount: Number(row.follower_count) || 0,
    createdAt: row.created_at,
  };
}

export async function readPublicCreator(
  username: string
): Promise<PublicCreator | null> {
  const { data, error } = await supabase
    .from('creator_public')
    .select(
      'uid, username, display_name, photo_url, bio, equipped_decoration, featured_badge, follower_count, created_at'
    )
    .eq('username', username)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return mapCreator(data);
}

export async function readOwnCreator(uid: string): Promise<PublicCreator | null> {
  const { data, error } = await supabase
    .from('creator_public')
    .select(
      'uid, username, display_name, photo_url, bio, equipped_decoration, featured_badge, follower_count, created_at'
    )
    .eq('uid', uid)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return mapCreator(data);
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
  throwIfError(error);
  return Boolean(data);
}

export async function syncProfilePublicFields(input: {
  visibility: 'public' | 'private';
  bio: string;
}): Promise<void> {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      visibility: input.visibility,
      bio: input.bio.slice(0, 500),
    })
    .eq('uid', uid);
  if (error && /column .* does not exist/i.test(error.message)) return;
  throwIfError(error);
}
