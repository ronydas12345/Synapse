-- Return comment author identity so the Workshop thread can show photos,
-- display names, decorations, and earned badges without a second round trip.

create or replace function public.list_workshop_comments(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
begin
  r := internal.resolve_creation(p_id);
  if r is null then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'uid', c.uid,
      'username', coalesce(p.username, pr.username, ''),
      'displayName', coalesce(p.display_name, pr.display_name, ''),
      'photoUrl', coalesce(p.photo_url, pr.photo_url, ''),
      'featuredBadge', coalesce(p.featured_badge, pr.featured_badge, ''),
      'equippedDecoration', coalesce(
        nullif(p.equipped_decoration, ''),
        nullif(pr.equipped_decoration, ''),
        'default'
      ),
      'badges', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', b.badge_id,
          'awardedAt', b.awarded_at
        ) order by b.awarded_at)
        from public.user_badges b
        where b.uid = c.uid
      ), '[]'::jsonb),
      'body', c.body,
      'createdAt', c.created_at
    ) order by c.created_at)
    from public.workshop_comments c
    left join public.creator_public p on p.uid = c.uid
    left join public.profiles pr on pr.uid = c.uid
    where c.creation_id = r.id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.list_workshop_comments(text) from public;
grant execute on function public.list_workshop_comments(text) to anon, authenticated;

notify pgrst, 'reload schema';
