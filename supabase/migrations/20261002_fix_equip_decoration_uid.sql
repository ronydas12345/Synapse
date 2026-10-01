-- PL/pgSQL variables named uid collide with uid columns when RLS joins
-- user_decorations / user_badges to creator_public (both have uid).
-- Equip decoration and featured badge still used the old variable name.

create or replace function public.equip_decoration(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if not exists (
    select 1 from public.user_decorations d
    where d.uid = viewer and d.decoration_id = p_id
  ) then
    raise exception 'Decoration is locked';
  end if;
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles
  set equipped_decoration = p_id
  where profiles.uid = viewer;
end;
$$;

create or replace function public.set_featured_badge(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  badge text := coalesce(p_id, '');
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if badge <> '' and not exists (
    select 1 from public.user_badges b
    where b.uid = viewer and b.badge_id = badge
  ) then
    raise exception 'You do not have that badge';
  end if;
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles
  set featured_badge = badge
  where profiles.uid = viewer;
end;
$$;

revoke execute on function public.equip_decoration(text) from public, anon;
grant execute on function public.equip_decoration(text) to authenticated;
revoke execute on function public.set_featured_badge(text) from public, anon;
grant execute on function public.set_featured_badge(text) to authenticated;
