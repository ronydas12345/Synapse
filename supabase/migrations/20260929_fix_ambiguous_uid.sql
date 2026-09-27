-- Qualify uid columns and stop PL/pgSQL variables named uid from colliding
-- when two tables in one query both have a uid column.
-- Also drop extra auth users that share an email.

create or replace function public.list_saved_creations()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(c) order by s.created_at desc)
    from public.workshop_saves s
    join public.workshop_creations c on c.id = s.creation_id
    where s.uid = viewer
      and internal.can_view_creation(c)
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_saved_workshop()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.list_saved_creations();
$$;

create or replace function public.list_saved_creators()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(p) order by s.created_at desc)
    from public.creator_saves s
    join public.creator_public p on p.uid = s.creator_uid
    where s.uid = viewer
      and p.visibility in ('public', 'unlisted')
  ), '[]'::jsonb);
end;
$$;

create or replace function public.toggle_creator_save(p_uid uuid)
returns boolean
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
  if p_uid is null or p_uid = viewer then
    raise exception 'Cannot save that account';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.uid = p_uid
      and p.status = 'active'
      and p.visibility in ('public', 'unlisted')
      and coalesce(p.saves_enabled, true)
  ) then
    raise exception 'Account not found';
  end if;
  delete from public.creator_saves s
  where s.uid = viewer and s.creator_uid = p_uid;
  if found then
    return false;
  end if;
  insert into public.creator_saves (uid, creator_uid) values (viewer, p_uid);
  return true;
end;
$$;

create or replace function public.toggle_workshop_like(p_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  r public.workshop_creations;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  if not r.likes_enabled and r.creator_uid <> viewer then
    raise exception 'Likes are turned off for this creation';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  delete from public.workshop_likes l
  where l.creation_id = r.id and l.uid = viewer;
  if found then
    return false;
  end if;
  insert into public.workshop_likes (creation_id, uid) values (r.id, viewer);
  return true;
end;
$$;

create or replace function public.toggle_workshop_save(p_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  r public.workshop_creations;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  if not coalesce(r.saves_enabled, true) and r.creator_uid <> viewer then
    raise exception 'Saves are turned off for this creation';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  delete from public.workshop_saves s
  where s.creation_id = r.id and s.uid = viewer;
  if found then
    return false;
  end if;
  insert into public.workshop_saves (creation_id, uid) values (r.id, viewer);
  return true;
end;
$$;

create or replace function public.delete_workshop_comment(p_id uuid)
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
  delete from public.workshop_comments c
  using public.workshop_creations w
  where c.id = p_id
    and c.creation_id = w.id
    and (c.uid = viewer or w.creator_uid = viewer or public.is_staff());
  if not found then
    raise exception 'Comment not found';
  end if;
end;
$$;

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
      'username', c.username,
      'body', c.body,
      'createdAt', c.created_at
    ) order by c.created_at)
    from public.workshop_comments c
    where c.creation_id = r.id
  ), '[]'::jsonb);
end;
$$;

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

drop policy if exists creator_public_read on public.creator_public;
create policy creator_public_read on public.creator_public
  for select to anon, authenticated
  using (
    creator_public.visibility in ('public', 'unlisted')
    or creator_public.uid = auth.uid()
    or public.is_staff()
  );

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

grant execute on function public.list_saved_creations() to authenticated;
grant execute on function public.list_saved_workshop() to authenticated;
grant execute on function public.list_saved_creators() to authenticated;
grant execute on function public.toggle_creator_save(uuid) to authenticated;
grant execute on function public.toggle_workshop_like(text) to authenticated;
grant execute on function public.toggle_workshop_save(text) to authenticated;
grant execute on function public.delete_workshop_comment(uuid) to authenticated;
grant execute on function public.list_workshop_comments(text) to anon, authenticated;

-- Keep one auth user per email. Prefer the verified superadmin, then a
-- confirmed account that already has a profile, then the oldest row.
delete from auth.users u
using (
  select id
  from (
    select
      au.id,
      row_number() over (
        partition by lower(au.email)
        order by
          (lower(au.email) = 'dasrony231@gmail.com' and au.email_confirmed_at is not null) desc,
          exists (
            select 1 from public.profiles p
            where p.uid = au.id and p.username <> ''
          ) desc,
          (au.email_confirmed_at is not null) desc,
          au.created_at asc
      ) as keep_rank
    from auth.users au
    where au.email is not null and au.email <> ''
  ) ranked
  where ranked.keep_rank > 1
) extra
where u.id = extra.id;

notify pgrst, 'reload schema';
