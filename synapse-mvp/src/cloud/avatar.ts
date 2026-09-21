import { supabase, throwIfError } from '../supabase/client';
import { httpsPhoto } from '../admin/model';
import { dataUrlToBlob } from '../profile/avatarImage';
import { useAuthStore } from '../auth/authStore';
import { useProfileStore } from '../profile/profileStore';
import type { UserProfile } from '../profile/types';

export type AvatarStatus = UserProfile['avatarStatus'];

function extensionFor(blob: Blob): string {
  if (blob.type === 'image/png') return 'png';
  if (blob.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function submitAvatarUrl(imageUrl: string): Promise<void> {
  const url = httpsPhoto(imageUrl);
  if (!url) throw new Error('Profile pictures must use an https URL.');
  const { error } = await supabase.rpc('submit_avatar_for_review', {
    p_image_url: url,
  });
  throwIfError(error);
}

export async function uploadAvatarFromDataUrl(dataUrl: string): Promise<string> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Sign in to upload a profile picture.');
  const blob = dataUrlToBlob(dataUrl);
  const path = `${user.uid}/${crypto.randomUUID()}.${extensionFor(blob)}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });
  throwIfError(uploadError);
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = httpsPhoto(data.publicUrl);
  if (!url) throw new Error('Could not build a public image URL.');
  await submitAvatarUrl(url);
  return url;
}

export async function readOwnAvatarState(): Promise<{
  url: string;
  status: AvatarStatus;
}> {
  const user = useAuthStore.getState().user;
  if (!user) return { url: '', status: 'none' };
  const { data: latest, error: latestError } = await supabase
    .from('moderation')
    .select('image_url, status')
    .eq('target_uid', user.uid)
    .eq('type', 'avatar')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(latestError);
  if (latest?.status === 'pending' && latest.image_url) {
    return { url: httpsPhoto(latest.image_url), status: 'pending' };
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('photo_url')
    .eq('uid', user.uid)
    .maybeSingle();
  throwIfError(error);
  const url = httpsPhoto(profile?.photo_url);
  if (url) return { url, status: 'approved' };
  if (latest?.status === 'rejected' || latest?.status === 'removed') {
    return { url: '', status: latest.status };
  }
  return { url: '', status: 'none' };
}

export async function applyAvatarStateToProfile(): Promise<void> {
  const avatar = await readOwnAvatarState();
  useProfileStore.getState().patch({
    avatarDataUrl: null,
    avatarUrl: avatar.url || null,
    avatarStatus: avatar.status,
  });
}

export async function removeOwnAvatar(): Promise<void> {
  const { error } = await supabase.rpc('clear_own_avatar');
  throwIfError(error);
  useProfileStore.getState().patch({
    avatarDataUrl: null,
    avatarUrl: null,
    avatarStatus: 'none',
  });
}

export function avatarPathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/avatars/';
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}
