import { createClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './config';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function throwIfError(
  error: { message: string; code?: string } | null
): void {
  if (!error) return;
  if (error.code === '23505') {
    throw new Error('That username is already taken.');
  }
  throw new Error(error.message);
}
