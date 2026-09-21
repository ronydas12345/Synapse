import { supabase, throwIfError } from '../supabase/client';
import { LEGAL } from '../site/legal';
import { useAuthStore } from '../auth/authStore';
import { listOwnTickets, listTicketMessages } from './api';
import { SYNAPSE_LOCAL_KEYS } from '../settings/localData';

export type ConsentPolicy = 'privacy' | 'terms' | 'cookies';

export async function recordConsents(source: 'signup' | 'login' | 'settings'): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;
  const rows = [
    { policy_id: 'privacy', policy_version: LEGAL.privacyVersion },
    { policy_id: 'terms', policy_version: LEGAL.termsVersion },
    { policy_id: 'cookies', policy_version: LEGAL.cookiesVersion },
  ].map((row) => ({
    uid: user.uid,
    ...row,
    accepted: true,
    source,
  }));
  const { error } = await supabase.from('user_consents').insert(rows);
  if (error && error.code !== '23505') throwIfError(error);
}

export async function exportMyAccount(): Promise<string> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Sign in to download your account data.');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('uid', user.uid)
    .maybeSingle();
  throwIfError(profileError);
  const tickets = await listOwnTickets(user.uid);
  const messages = [];
  for (const ticket of tickets) {
    messages.push({ ticketId: ticket.id, messages: await listTicketMessages(ticket.id) });
  }
  const { data: consents, error: consentError } = await supabase
    .from('user_consents')
    .select('policy_id, policy_version, accepted, source, created_at')
    .eq('uid', user.uid);
  throwIfError(consentError);
  const { data: requests, error: requestError } = await supabase
    .from('data_subject_requests')
    .select('id, request_type, status, summary, created_at, completed_at')
    .eq('uid', user.uid);
  throwIfError(requestError);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      controller: LEGAL.operator,
      contact: LEGAL.contactEmail,
      rights: ['access', 'rectify', 'erase', 'restrict', 'object', 'portability'],
      account: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        providers: user.providers,
      },
      profile,
      tickets,
      ticketMessages: messages,
      consents: consents ?? [],
      dataSubjectRequests: requests ?? [],
      localStorageKeysOnThisDevice: SYNAPSE_LOCAL_KEYS,
    },
    null,
    2
  );
}

export async function requestOwnErasure(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Sign in first.');
  const { error } = await supabase.from('data_subject_requests').insert({
    uid: user.uid,
    request_type: 'erase',
    status: 'received',
    summary: 'User requested erasure from Settings → Privacy.',
  });
  throwIfError(error);
}

export async function deleteOwnAccount(): Promise<void> {
  await requestOwnErasure();
  const { error } = await supabase.rpc('delete_own_account');
  throwIfError(error);
}
