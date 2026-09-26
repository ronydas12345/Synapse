import { supabase, throwIfError } from '../supabase/client';

export async function listUnlockedDecorations(uid: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_decorations')
    .select('decoration_id')
    .eq('uid', uid);
  throwIfError(error);
  return (data ?? []).map((row) => String(row.decoration_id));
}

export async function equipDecoration(id: string): Promise<void> {
  const { error } = await supabase.rpc('equip_decoration', { p_id: id });
  throwIfError(error);
}

export async function staffGrantDecoration(uid: string, id: string): Promise<void> {
  const { error } = await supabase.rpc('staff_grant_decoration', {
    p_uid: uid,
    p_id: id,
  });
  throwIfError(error);
}
