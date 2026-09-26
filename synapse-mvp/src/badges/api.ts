import { supabase, throwIfError } from '../supabase/client';
import type { BadgeDef } from './catalog';
import { BADGE_CATALOG, badgeDef } from './catalog';

export interface EarnedBadge {
  id: string;
  awardedAt: string | null;
  def: BadgeDef;
}

function asBadge(id: string, awardedAt: string | null): EarnedBadge | null {
  const def = badgeDef(id);
  if (!def) return null;
  return { id, awardedAt, def };
}

export async function listEarnedBadges(uid: string): Promise<EarnedBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, awarded_at')
    .eq('uid', uid);
  throwIfError(error);
  const earned = (data ?? [])
    .map((row) => asBadge(String(row.badge_id), (row.awarded_at as string) || null))
    .filter((row): row is EarnedBadge => Boolean(row));
  const order = new Map(BADGE_CATALOG.map((badge, index) => [badge.id, index]));
  return earned.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export async function evaluateOwnProgress(): Promise<void> {
  const { error } = await supabase.rpc('evaluate_own_progress');
  if (error && /does not exist|schema cache/i.test(error.message)) return;
  throwIfError(error);
}

export async function setFeaturedBadge(badgeId: string): Promise<void> {
  const { error } = await supabase.rpc('set_featured_badge', { p_id: badgeId });
  throwIfError(error);
}

export async function staffAwardBadge(uid: string, badgeId: string): Promise<void> {
  const { error } = await supabase.rpc('staff_award_badge', {
    p_uid: uid,
    p_badge: badgeId,
  });
  throwIfError(error);
}

export async function staffRevokeBadge(uid: string, badgeId: string): Promise<void> {
  const { error } = await supabase.rpc('staff_revoke_badge', {
    p_uid: uid,
    p_badge: badgeId,
  });
  throwIfError(error);
}
