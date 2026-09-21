import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { writeAccountCache, type AccountIdentity } from './identity';
import { useProfileStore } from '../profile/profileStore';
import { useAuthStore } from './authStore';
import { authErrorMessage, type SessionUser } from './session';
import { upsertOwnUser } from '../admin/syncAccount';
import { clearReturnPath } from './returnPath';

function providersFromUser(user: User): string[] {
  const fromIdentities = (user.identities ?? []).map((identity) => {
    if (identity.provider === 'google') return 'google.com';
    if (identity.provider === 'email') return 'password';
    return identity.provider;
  });
  if (fromIdentities.length) return fromIdentities.filter(Boolean);
  const provider = String(user.app_metadata?.provider || '');
  if (provider === 'google') return ['google.com'];
  if (provider === 'email') return ['password'];
  return provider ? [provider] : [];
}

function metaString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

export function sessionFromUser(user: User): SessionUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      metaString(meta, 'display_name') ||
      metaString(meta, 'full_name') ||
      metaString(meta, 'name'),
    photoURL: metaString(meta, 'avatar_url') || metaString(meta, 'picture'),
    emailVerified: Boolean(user.email_confirmed_at),
    providers: providersFromUser(user),
  };
}

export function messageFromAuthError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  ) {
    return authErrorMessage((err as { code: string }).code);
  }
  if (err instanceof Error && err.message) {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login')) {
      return authErrorMessage('invalid_credentials');
    }
    if (msg.includes('email not confirmed')) {
      return authErrorMessage('email_not_confirmed');
    }
    if (
      msg.includes('already registered') ||
      msg.includes('already been registered')
    ) {
      return authErrorMessage('user_already_exists');
    }
    if (
      msg.includes('provider is not enabled') ||
      msg.includes('unsupported provider')
    ) {
      return authErrorMessage('provider_disabled');
    }
    return err.message;
  }
  return authErrorMessage('unknown');
}

export function applyIdentityToProfile(identity: AccountIdentity): void {
  const { setUsername, setDisplayName } = useProfileStore.getState();
  setUsername(identity.username);
  setDisplayName(identity.displayName);
}

async function saveIdentity(
  user: User,
  identity: AccountIdentity
): Promise<SessionUser> {
  await supabase.auth.updateUser({
    data: {
      display_name: identity.displayName,
      username: identity.username,
    },
  });
  const { data } = await supabase.auth.getUser();
  const next = data.user ?? user;
  writeAccountCache(next.id, identity);
  applyIdentityToProfile(identity);
  const session = sessionFromUser(next);
  try {
    await upsertOwnUser(session, identity);
  } catch {
    /* profile write may fail if RLS is not applied yet */
  }
  return session;
}

function authRedirectTo(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authRedirectTo(),
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (data.url) window.location.assign(data.url);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Could not sign in.');
  return sessionFromUser(data.user);
}

export async function createAccountWithEmail(
  email: string,
  password: string,
  identity: AccountIdentity
): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: identity.displayName,
        username: identity.username,
      },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Could not create that account.');
  if (!data.session) {
    writeAccountCache(data.user.id, identity);
    throw new Error('Check your email to confirm this account, then log in.');
  }
  return saveIdentity(data.user, identity);
}

export async function completeAccountIdentity(
  identity: AccountIdentity
): Promise<SessionUser> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in before saving your name.');
  return saveIdentity(data.user, identity);
}

export async function signOut(): Promise<void> {
  const uid = useAuthStore.getState().user?.uid;
  useProfileStore.getState().clearAccount(uid);
  useAuthStore.getState().setError(null);
  clearReturnPath();
  await supabase.auth.signOut();
}

export function subscribeAuth(
  listener: (user: SessionUser | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session?.user ? sessionFromUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}
