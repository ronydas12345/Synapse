-- Workshop Users must follow profiles.visibility. creator_public can lag when
-- set_profile_public is not executable, and listing only the catalog then
-- hides accounts that are already public on the profile row.

create or replace function public.list_public_creators(
  p_query text default '',
  p_order text default 'followers'
)
returns setof public.creator_public
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := trim(coalesce(p_query, ''));
begin
  if p_order = 'new' then
    return query
      select
        c.uid,
        c.username,
        c.display_name,
        c.photo_url,
        c.bio,
        c.equipped_decoration,
        c.featured_badge,
        p.visibility,
        c.follower_count,
        c.created_at,
        c.share_id,
        c.follows_enabled,
        c.saves_enabled
      from public.profiles p
      join public.creator_public c on c.uid = p.uid
      where p.visibility = 'public'
        and coalesce(p.status, 'active') = 'active'
        and (
          q = ''
          or c.username ilike '%' || q || '%'
          or c.display_name ilike '%' || q || '%'
        )
      order by c.created_at desc nulls last
      limit 60;
    return;
  end if;

  return query
    select
      c.uid,
      c.username,
      c.display_name,
      c.photo_url,
      c.bio,
      c.equipped_decoration,
      c.featured_badge,
      p.visibility,
      c.follower_count,
      c.created_at,
      c.share_id,
      c.follows_enabled,
      c.saves_enabled
    from public.profiles p
    join public.creator_public c on c.uid = p.uid
    where p.visibility = 'public'
      and coalesce(p.status, 'active') = 'active'
      and (
        q = ''
        or c.username ilike '%' || q || '%'
        or c.display_name ilike '%' || q || '%'
      )
    order by c.follower_count desc, c.created_at desc nulls last
    limit 60;
end;
$$;

grant execute on function public.list_public_creators(text, text) to anon, authenticated;
grant execute on function public.set_profile_public(text, text) to authenticated;
notify pgrst, 'reload schema';
