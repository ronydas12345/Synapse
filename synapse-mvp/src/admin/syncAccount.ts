import { supabase, throwIfError } from '../supabase/client';
import { isIdentityComplete, type AccountIdentity } from '../auth/identity';
import type { SessionUser } from '../auth/session';
import type { AccountStatus } from './model';
import { httpsPhoto } from './model';
import { listPublishedThemes } from './api';
import { parseTheme } from '../theme/parseTheme';
import { useThemeStore } from '../theme/themeStore';

export async function upsertOwnUser(
  user: SessionUser,
  identity: AccountIdentity
): Promise<AccountStatus> {
  if (!user.email || !isIdentityComplete(identity.username, identity.displayName)) {
    return 'active';
  }
  const photoURL = httpsPhoto(user.photoURL);
  const { data, error } = await supabase
    .from('profiles')
    .select('status')
    .eq('uid', user.uid)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    const { error: insertError } = await supabase.from('profiles').insert({
      uid: user.uid,
      email: user.email.toLowerCase(),
      username: identity.username,
      display_name: identity.displayName,
      photo_url: photoURL,
      status: 'active',
      email_verified: user.emailVerified,
    });
    throwIfError(insertError);
    return 'active';
  }
  const status = data.status === 'suspended' ? 'suspended' : 'active';
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      username: identity.username,
      display_name: identity.displayName,
      photo_url: photoURL,
      email_verified: user.emailVerified,
      last_seen_at: new Date().toISOString(),
    })
    .eq('uid', user.uid);
  throwIfError(updateError);
  return status;
}

export async function readStaffAdmin(uid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('roles')
    .select('role, active')
    .eq('uid', uid)
    .maybeSingle();
  if (error || !data) return false;
  return data.role === 'admin' && data.active !== false;
}

export function subscribeStaffAdmin(
  uid: string,
  listener: (activeAdmin: boolean) => void
): () => void {
  const channel = supabase
    .channel(`role:${uid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'roles', filter: `uid=eq.${uid}` },
      (payload) => {
        const row = payload.new as { role?: string; active?: boolean } | null;
        if (!row || payload.eventType === 'DELETE') {
          listener(false);
          return;
        }
        listener(row.role === 'admin' && row.active !== false);
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeAccountStatus(
  uid: string,
  listener: (status: AccountStatus) => void
): () => void {
  const channel = supabase
    .channel(`profile:${uid}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `uid=eq.${uid}`,
      },
      (payload) => {
        const row = payload.new as { status?: string } | null;
        listener(row?.status === 'suspended' ? 'suspended' : 'active');
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function hydratePublishedThemes(): Promise<void> {
  const rows = await listPublishedThemes();
  const themes = [];
  for (const row of rows) {
    if (row.status !== 'published') continue;
    try {
      const parsed = parseTheme(JSON.parse(row.payloadJson) as unknown);
      if (parsed) themes.push(parsed);
    } catch {
      /* skip invalid payloads */
    }
  }
  if (themes.length) useThemeStore.getState().ingestPublished(themes);
}
