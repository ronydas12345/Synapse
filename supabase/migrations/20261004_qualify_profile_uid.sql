-- Client profile UPDATEs fail with "column reference uid is ambiguous"
-- because profiles RLS is `uid = auth.uid() or is_staff()` and is_staff()
-- is a SQL function that Postgres inlines onto roles (also has uid).
-- Switch staff helpers to plpgsql (not inlined) and qualify remaining
-- policies. Also add set_profile_public so visibility/bio do not depend
-- on a table UPDATE from the browser.

create or replace function public.is_superadmin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = 'dasrony231@gmail.com'
      and u.email_confirmed_at is not null
  );
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.roles r
    where r.uid = auth.uid()
      and r.role = 'admin'
      and r.active = true
  );
end;
$$;

create or replace function public.is_staff()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_superadmin() or public.is_admin();
end;
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (profiles.uid = auth.uid() or public.is_staff());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (
    (
      profiles.uid = auth.uid()
      and status = 'active'
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    or public.is_superadmin()
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (profiles.uid = auth.uid() or public.is_staff())
  with check (profiles.uid = auth.uid() or public.is_staff());

drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated
  using (roles.uid = auth.uid() or public.is_superadmin());

drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets
  for select to authenticated
  using (tickets.uid = auth.uid() or public.is_staff());

drop policy if exists user_workspaces_select on public.user_workspaces;
create policy user_workspaces_select on public.user_workspaces
  for select to authenticated
  using (user_workspaces.uid = auth.uid());

drop policy if exists user_workspaces_insert on public.user_workspaces;
create policy user_workspaces_insert on public.user_workspaces
  for insert to authenticated
  with check (user_workspaces.uid = auth.uid());

drop policy if exists user_workspaces_update on public.user_workspaces;
create policy user_workspaces_update on public.user_workspaces
  for update to authenticated
  using (user_workspaces.uid = auth.uid())
  with check (user_workspaces.uid = auth.uid());

drop policy if exists creator_saves_own on public.creator_saves;
create policy creator_saves_own on public.creator_saves
  for select to authenticated
  using (creator_saves.uid = auth.uid() or public.is_staff());

drop policy if exists workshop_likes_own on public.workshop_likes;
create policy workshop_likes_own on public.workshop_likes
  for select to authenticated
  using (workshop_likes.uid = auth.uid() or public.is_staff());

drop policy if exists workshop_saves_own on public.workshop_saves;
create policy workshop_saves_own on public.workshop_saves
  for select to authenticated
  using (workshop_saves.uid = auth.uid() or public.is_staff());

drop policy if exists user_consents_select on public.user_consents;
create policy user_consents_select on public.user_consents
  for select to authenticated
  using (user_consents.uid = auth.uid() or public.is_staff());

drop policy if exists data_subject_requests_select on public.data_subject_requests;
create policy data_subject_requests_select on public.data_subject_requests
  for select to authenticated
  using (data_subject_requests.uid = auth.uid() or public.is_staff());

drop policy if exists user_badges_read on public.user_badges;
create policy user_badges_read on public.user_badges
  for select to anon, authenticated
  using (
    user_badges.uid = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.creator_public c
      where c.uid = user_badges.uid and c.visibility in ('public', 'unlisted')
    )
  );

drop policy if exists user_decorations_read on public.user_decorations;
create policy user_decorations_read on public.user_decorations
  for select to anon, authenticated
  using (
    user_decorations.uid = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.creator_public c
      where c.uid = user_decorations.uid and c.visibility in ('public', 'unlisted')
    )
  );

create or replace function public.set_profile_public(p_visibility text, p_bio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  vis text := coalesce(p_visibility, 'private');
  bio text := coalesce(p_bio, '');
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if vis not in ('public', 'unlisted', 'private') then
    raise exception 'Invalid visibility';
  end if;
  if char_length(bio) > 500 then
    raise exception 'Bio is too long';
  end if;
  update public.profiles
    set visibility = vis,
        bio = bio
  where profiles.uid = viewer;
end;
$$;

create or replace function public.set_profile_social(
  p_follows boolean,
  p_likes boolean default null,
  p_comments boolean default null,
  p_saves boolean default null
)
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
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles
    set follows_enabled = coalesce(p_follows, follows_enabled),
        default_likes_enabled = coalesce(p_likes, default_likes_enabled),
        default_comments_enabled = coalesce(p_comments, default_comments_enabled),
        saves_enabled = coalesce(p_saves, saves_enabled)
  where profiles.uid = viewer;
end;
$$;

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

revoke execute on function public.set_profile_public(text, text) from public, anon;
grant execute on function public.set_profile_public(text, text) to authenticated;
revoke execute on function public.set_profile_social(boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_profile_social(boolean, boolean, boolean, boolean) to authenticated;
revoke execute on function public.equip_decoration(text) from public, anon;
grant execute on function public.equip_decoration(text) to authenticated;
revoke execute on function public.set_featured_badge(text) from public, anon;
grant execute on function public.set_featured_badge(text) to authenticated;
grant execute on function public.is_superadmin() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

notify pgrst, 'reload schema';
