import { createClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './config';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function isSchemaCacheError(
  error: { message: string; code?: string } | null
): boolean {
  if (!error) return false;
  const message = error.message || '';
  return (
    error.code === 'PGRST202' ||
    error.code === 'PGRST205' ||
    /schema cache|could not find the function|function [\w.]+ does not exist/i.test(
      message
    )
  );
}

export function throwIfError(
  error: { message: string; code?: string } | null
): void {
  if (!error) return;
  if (error.code === '23505') {
    throw new Error('That username is already taken.');
  }
  if (isSchemaCacheError(error)) {
    console.warn('Supabase schema cache miss', error);
    throw new Error('This feature is still connecting. Refresh in a moment and try again.');
  }
  throw new Error(error.message);
}

export function isMissingSchema(
  error: { message: string; code?: string } | null
): boolean {
  return Boolean(
    error &&
      (isSchemaCacheError(error) ||
        /permission denied for function is_staff/i.test(error.message))
  );
}
