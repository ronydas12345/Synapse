-- evaluate_own_progress still raised "column reference uid is ambiguous"
-- even after renaming the equip RPC variable. Every profile load revokes
-- staff badges the viewer does not hold, and that DELETE used unqualified
-- uid while RLS also reads creator_public.uid.

create or replace function internal.revoke_badge(p_uid uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_badges b
  where b.uid = p_uid and b.badge_id = p_badge;
end;
$$;

create or replace function internal.evaluate_user_progress(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  created timestamptz;
  public_uploads int;
  ever_published boolean;
  followers int;
begin
  if p_uid is null then
    return;
  end if;
  select p.created_at into created from public.profiles p where p.uid = p_uid;
  if created is null then
    return;
  end if;
  if now() - created >= interval '30 days' then
    perform internal.award_badge(p_uid, 'one_month');
  end if;
  if now() - created >= interval '365 days' then
    perform internal.award_badge(p_uid, 'one_year');
  end if;
  select exists (
    select 1 from public.workshop_creations c
    where c.creator_uid = p_uid and c.published_at is not null
  ) into ever_published;
  if ever_published then
    perform internal.award_badge(p_uid, 'first_creation');
  end if;
  select count(*)::int into public_uploads
  from public.workshop_creations c
  where c.creator_uid = p_uid
    and c.visibility = 'public'
    and c.status = 'active'
    and c.published_at is not null;
  if public_uploads >= 10 then perform internal.award_badge(p_uid, 'uploads_10'); end if;
  if public_uploads >= 25 then perform internal.award_badge(p_uid, 'uploads_25'); end if;
  if public_uploads >= 100 then perform internal.award_badge(p_uid, 'uploads_100'); end if;
  select count(*)::int into followers from public.follows f where f.followee_uid = p_uid;
  if followers >= 10 then perform internal.award_badge(p_uid, 'followers_10'); end if;
  if followers >= 100 then perform internal.award_badge(p_uid, 'followers_100'); end if;
  if public.is_superadmin_uid(p_uid) then
    perform internal.award_badge(p_uid, 'superadmin');
  else
    perform internal.revoke_badge(p_uid, 'superadmin');
  end if;
  if exists (
    select 1 from public.roles r
    where r.uid = p_uid and r.role = 'admin' and r.active = true
  ) then
    perform internal.award_badge(p_uid, 'admin');
  else
    perform internal.revoke_badge(p_uid, 'admin');
  end if;
end;
$$;

-- Re-apply in case 20261002 never ran on the remote database.
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

notify pgrst, 'reload schema';
