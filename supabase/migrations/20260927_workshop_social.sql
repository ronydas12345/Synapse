-- Share IDs, comments, creator bookmarks, and creator-controlled social flags.
-- Also widens profile visibility to unlisted and reloads the API schema cache.

create or replace function internal.new_share_id()
returns text
language plpgsql
as $$
declare
  alphabet text := 'abcdefghijkmnopqrstuvwxyz23456789';
  result text;
  i int;
begin
  loop
    result := '';
    for i in 1..10 loop
      result := result || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles p where p.share_id = result)
      and not exists (select 1 from public.workshop_creations c where c.share_id = result)
      and not exists (select 1 from public.profiles p where p.username = result);
  end loop;
  return result;
end;
$$;

alter table public.profiles drop constraint if exists profiles_visibility_check;
alter table public.profiles
  add column if not exists share_id text unique,
  add column if not exists follows_enabled boolean not null default true,
  add column if not exists saves_enabled boolean not null default true;

alter table public.profiles
  alter column visibility set default 'private';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and conname = 'profiles_visibility_check'
  ) then
    alter table public.profiles
      add constraint profiles_visibility_check
      check (visibility in ('public', 'unlisted', 'private'));
  end if;
end $$;

alter table public.creator_public
  add column if not exists share_id text unique,
  add column if not exists follows_enabled boolean not null default true,
  add column if not exists saves_enabled boolean not null default true;

alter table public.workshop_creations
  add column if not exists share_id text unique,
  add column if not exists likes_enabled boolean not null default true,
  add column if not exists comments_enabled boolean not null default true,
  add column if not exists saves_enabled boolean not null default true,
  add column if not exists comment_count int not null default 0 check (comment_count >= 0);

update public.profiles
  set share_id = internal.new_share_id()
  where share_id is null;

alter table public.profiles
  alter column share_id set not null;

update public.workshop_creations
  set share_id = internal.new_share_id()
  where share_id is null;

alter table public.workshop_creations
  alter column share_id set not null;

update public.creator_public c
  set share_id = p.share_id,
      follows_enabled = p.follows_enabled,
      saves_enabled = p.saves_enabled
  from public.profiles p
  where c.uid = p.uid;

create or replace function public.profiles_assign_share_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.share_id is null or new.share_id = '' then
    new.share_id := internal.new_share_id();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_assign_share_id on public.profiles;
create trigger profiles_assign_share_id
before insert on public.profiles
for each row execute function public.profiles_assign_share_id();

create or replace function public.workshop_assign_share_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.share_id is null or new.share_id = '' then
    new.share_id := internal.new_share_id();
  end if;
  return new;
end;
$$;

drop trigger if exists workshop_assign_share_id on public.workshop_creations;
create trigger workshop_assign_share_id
before insert on public.workshop_creations
for each row execute function public.workshop_assign_share_id();

create or replace function public.sync_creator_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.creator_public (
    uid, username, display_name, photo_url, bio, equipped_decoration,
    featured_badge, visibility, share_id, follows_enabled, saves_enabled, created_at
  )
  values (
    new.uid, new.username, new.display_name, new.photo_url, new.bio,
    new.equipped_decoration, new.featured_badge, new.visibility, new.share_id,
    new.follows_enabled, new.saves_enabled, new.created_at
  )
  on conflict (uid) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    photo_url = excluded.photo_url,
    bio = excluded.bio,
    equipped_decoration = excluded.equipped_decoration,
    featured_badge = excluded.featured_badge,
    visibility = excluded.visibility,
    share_id = excluded.share_id,
    follows_enabled = excluded.follows_enabled,
    saves_enabled = excluded.saves_enabled;

  insert into public.user_decorations (uid, decoration_id)
  values (new.uid, 'default')
  on conflict do nothing;

  update public.workshop_creations
    set creator_username = new.username,
        creator_display_name = new.display_name
    where creator_uid = new.uid;

  return new;
end;
$$;

create table if not exists public.workshop_comments (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 400),
  created_at timestamptz not null default now()
);

create index if not exists workshop_comments_creation_idx
  on public.workshop_comments (creation_id, created_at desc);

create table if not exists public.creator_saves (
  uid uuid not null references auth.users (id) on delete cascade,
  creator_uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (uid, creator_uid),
  constraint creator_saves_no_self check (uid <> creator_uid)
);

create index if not exists creator_saves_creator_idx on public.creator_saves (creator_uid);

create or replace function public.bump_workshop_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('synapse.workshop_rpc', '1', true);
  if tg_op = 'INSERT' then
    update public.workshop_creations
      set comment_count = comment_count + 1
      where id = new.creation_id;
    return new;
  end if;
  update public.workshop_creations
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.creation_id;
  return old;
end;
$$;

drop trigger if exists workshop_comments_count on public.workshop_comments;
create trigger workshop_comments_count
after insert or delete on public.workshop_comments
for each row execute function public.bump_workshop_comment();

create or replace function public.resolve_share(p_ref text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ref text := lower(trim(coalesce(p_ref, '')));
  c public.workshop_creations;
  p public.creator_public;
begin
  if ref = '' then
    return null;
  end if;

  if ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into c from public.workshop_creations where id = ref::uuid;
  else
    select * into c from public.workshop_creations where share_id = ref;
  end if;
  if found and internal.can_view_creation(c) then
    return jsonb_build_object(
      'kind', 'playlist',
      'id', c.id,
      'shareId', c.share_id,
      'path', '/p/' || c.share_id
    );
  end if;

  select * into p from public.creator_public
  where share_id = ref or username = ref;
  if found and p.visibility in ('public', 'unlisted') then
    return jsonb_build_object(
      'kind', 'user',
      'id', p.uid,
      'shareId', p.share_id,
      'username', p.username,
      'path', '/u/' || p.username
    );
  end if;
  return null;
end;
$$;

create or replace function public.get_workshop_creation(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
  ref text := lower(trim(coalesce(p_id, '')));
begin
  if ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    r := internal.read_creation(ref::uuid);
  else
    select * into r from public.workshop_creations where share_id = ref;
    if not found or not internal.can_view_creation(r) then
      return null;
    end if;
  end if;
  if r is null then
    return null;
  end if;
  return to_jsonb(r);
end;
$$;

drop function if exists public.get_workshop_creation(uuid);

create or replace function public.follow_creator(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed boolean;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if p_uid is null or p_uid = uid then
    raise exception 'Cannot follow that account';
  end if;
  select follows_enabled into allowed from public.profiles where profiles.uid = p_uid and status = 'active';
  if allowed is null then
    raise exception 'Account not found';
  end if;
  if not allowed then
    raise exception 'This creator is not accepting followers';
  end if;
  insert into public.follows (follower_uid, followee_uid)
  values (uid, p_uid)
  on conflict do nothing;
end;
$$;

create or replace function public.toggle_creator_save(p_uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed boolean;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if p_uid is null or p_uid = uid then
    raise exception 'Cannot save that account';
  end if;
  select saves_enabled into allowed
  from public.profiles
  where profiles.uid = p_uid and status = 'active';
  if not found then
    raise exception 'Account not found';
  end if;
  if not coalesce(allowed, false) then
    raise exception 'This creator is not accepting saves';
  end if;
  delete from public.creator_saves
  where creator_saves.uid = uid and creator_uid = p_uid;
  if found then
    return false;
  end if;
  insert into public.creator_saves (uid, creator_uid) values (uid, p_uid);
  return true;
end;
$$;

create or replace function public.toggle_workshop_like(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.workshop_creations;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  r := internal.read_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  if not r.likes_enabled then
    raise exception 'Likes are turned off for this creation';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  delete from public.workshop_likes
  where creation_id = p_id and workshop_likes.uid = uid;
  if found then
    return false;
  end if;
  insert into public.workshop_likes (creation_id, uid) values (p_id, uid);
  return true;
end;
$$;

create or replace function public.toggle_workshop_save(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.workshop_creations;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  r := internal.read_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  if not r.saves_enabled then
    raise exception 'Saves are turned off for this creation';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  delete from public.workshop_saves
  where creation_id = p_id and workshop_saves.uid = uid;
  if found then
    return false;
  end if;
  insert into public.workshop_saves (creation_id, uid) values (p_id, uid);
  return true;
end;
$$;

create or replace function public.add_workshop_comment(p_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.workshop_creations;
  body text := trim(coalesce(p_body, ''));
  recent int;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if char_length(body) < 1 or char_length(body) > 400 then
    raise exception 'Comment must be 1–400 characters';
  end if;
  r := internal.read_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility <> 'public' then
    raise exception 'Comments are only on public creations';
  end if;
  if not r.comments_enabled then
    raise exception 'Comments are turned off for this creation';
  end if;
  select count(*)::int into recent
  from public.workshop_comments
  where workshop_comments.uid = uid and created_at > now() - interval '1 minute';
  if recent >= 8 then
    raise exception 'Too many comments. Wait a moment and try again.';
  end if;
  insert into public.workshop_comments (creation_id, uid, body)
  values (p_id, uid, body)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.delete_workshop_comment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.workshop_comments;
  creator uuid;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  select * into row from public.workshop_comments where id = p_id;
  if not found then
    raise exception 'Comment not found';
  end if;
  select creator_uid into creator from public.workshop_creations where id = row.creation_id;
  if row.uid <> uid and creator <> uid and not public.is_staff() then
    raise exception 'Cannot delete that comment';
  end if;
  delete from public.workshop_comments where id = p_id;
end;
$$;

create or replace function public.list_workshop_comments(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
begin
  r := internal.read_creation(p_id);
  if r is null then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'uid', c.uid,
      'body', c.body,
      'createdAt', c.created_at,
      'username', coalesce(p.username, ''),
      'displayName', coalesce(p.display_name, '')
    ) order by c.created_at)
    from public.workshop_comments c
    left join public.creator_public p on p.uid = c.uid
    where c.creation_id = p_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.set_creation_social(
  p_id uuid,
  p_likes boolean,
  p_comments boolean,
  p_saves boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set likes_enabled = coalesce(p_likes, likes_enabled),
        comments_enabled = coalesce(p_comments, comments_enabled),
        saves_enabled = coalesce(p_saves, saves_enabled)
    where id = p_id
      and (creator_uid = auth.uid() or public.is_staff());
  if not found then
    raise exception 'Creation not found';
  end if;
end;
$$;

create or replace function public.set_profile_social(
  p_follows boolean,
  p_saves boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles
    set follows_enabled = coalesce(p_follows, follows_enabled),
        saves_enabled = coalesce(p_saves, saves_enabled)
    where profiles.uid = uid;
end;
$$;

create or replace function public.list_saved_workshop()
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
    return '[]'::jsonb;
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
    return '[]'::jsonb;
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

alter table public.workshop_comments enable row level security;
alter table public.creator_saves enable row level security;

drop policy if exists workshop_comments_read on public.workshop_comments;
create policy workshop_comments_read on public.workshop_comments
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.workshop_creations c
      where c.id = workshop_comments.creation_id
        and c.visibility = 'public'
        and c.status = 'active'
    )
    or exists (
      select 1 from public.workshop_creations c
      where c.id = workshop_comments.creation_id
        and (c.creator_uid = auth.uid() or public.is_staff())
    )
  );

drop policy if exists creator_saves_own on public.creator_saves;
create policy creator_saves_own on public.creator_saves
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

drop policy if exists creator_public_read on public.creator_public;
create policy creator_public_read on public.creator_public
  for select to anon, authenticated
  using (visibility in ('public', 'unlisted') or uid = auth.uid() or public.is_staff());

drop policy if exists user_badges_read on public.user_badges;
create policy user_badges_read on public.user_badges
  for select to anon, authenticated
  using (
    uid = auth.uid()
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
    uid = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.creator_public c
      where c.uid = user_decorations.uid and c.visibility in ('public', 'unlisted')
    )
  );

grant select on public.workshop_comments to anon, authenticated;
grant select on public.creator_saves to authenticated;

revoke execute on function public.resolve_share(text) from public;
grant execute on function public.resolve_share(text) to anon, authenticated;

revoke execute on function public.get_workshop_creation(text) from public;
grant execute on function public.get_workshop_creation(text) to anon, authenticated;

revoke execute on function public.toggle_creator_save(uuid) from public, anon;
grant execute on function public.toggle_creator_save(uuid) to authenticated;

revoke execute on function public.add_workshop_comment(uuid, text) from public, anon;
grant execute on function public.add_workshop_comment(uuid, text) to authenticated;

revoke execute on function public.delete_workshop_comment(uuid) from public, anon;
grant execute on function public.delete_workshop_comment(uuid) to authenticated;

revoke execute on function public.list_workshop_comments(uuid) from public;
grant execute on function public.list_workshop_comments(uuid) to anon, authenticated;

revoke execute on function public.set_creation_social(uuid, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_creation_social(uuid, boolean, boolean, boolean) to authenticated;

revoke execute on function public.set_profile_social(boolean, boolean) from public, anon;
grant execute on function public.set_profile_social(boolean, boolean) to authenticated;

revoke execute on function public.list_saved_workshop() from public, anon;
grant execute on function public.list_saved_workshop() to authenticated;

revoke execute on function public.list_saved_creators() from public, anon;
grant execute on function public.list_saved_creators() to authenticated;

revoke execute on function public.profiles_assign_share_id() from public, anon, authenticated;
revoke execute on function public.workshop_assign_share_id() from public, anon, authenticated;
revoke execute on function public.bump_workshop_comment() from public, anon, authenticated;

create or replace function public.touch_workshop_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.id := old.id;
  new.creator_uid := old.creator_uid;
  new.created_at := old.created_at;
  new.share_id := old.share_id;
  new.updated_at := now();
  if coalesce(current_setting('synapse.workshop_rpc', true), '') <> '1' then
    new.featured := old.featured;
    new.featured_at := old.featured_at;
    new.status := old.status;
    new.like_count := old.like_count;
    new.save_count := old.save_count;
    new.remix_count := old.remix_count;
    new.comment_count := old.comment_count;
    new.likes_enabled := old.likes_enabled;
    new.comments_enabled := old.comments_enabled;
    new.saves_enabled := old.saves_enabled;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
