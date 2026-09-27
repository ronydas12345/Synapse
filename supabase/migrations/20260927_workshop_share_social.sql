-- Workshop foundation (idempotent), share codes, comments, bookmarks, creator toggles.
-- Reloads the PostgREST schema cache so badges and publish RPCs resolve.

create extension if not exists pgcrypto;
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalogs and workshop tables
-- ---------------------------------------------------------------------------

create table if not exists public.badge_defs (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null check (char_length(name) between 1 and 40),
  description text not null check (char_length(description) between 1 and 200),
  category text not null,
  sort_order int not null default 0
);

create table if not exists public.decoration_defs (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null check (char_length(name) between 1 and 40),
  description text not null check (char_length(description) between 1 and 200),
  css_class text not null check (css_class ~ '^synapse-deco-[a-z0-9-]+$'),
  sort_order int not null default 0
);

insert into public.badge_defs (id, name, description, category, sort_order) values
  ('first_creation', 'First Creation', 'Published your first creation to the Synapse Workshop.', 'creator', 10),
  ('uploads_10', '10 Uploads', 'Published 10 public Workshop creations.', 'creator', 20),
  ('uploads_25', '25 Uploads', 'Published 25 public Workshop creations.', 'creator', 30),
  ('uploads_100', '100 Uploads', 'Published 100 public Workshop creations.', 'creator', 40),
  ('one_month', 'One Month', 'Account has been active for 30 days.', 'account', 50),
  ('one_year', 'One Year', 'Account has been active for one year.', 'account', 60),
  ('admin', 'Admin', 'Appointed Synapse Admin.', 'staff', 70),
  ('superadmin', 'Superadmin', 'Synapse owner.', 'staff', 80),
  ('followers_10', '10 Followers', 'Reached 10 followers.', 'community', 90),
  ('followers_100', '100 Followers', 'Reached 100 followers.', 'community', 100)
on conflict (id) do nothing;

insert into public.decoration_defs (id, name, description, css_class, sort_order) values
  ('default', 'Default', 'Standard profile frame.', 'synapse-deco-default', 10),
  ('one_month', 'One Month', 'Unlocked with the One Month badge.', 'synapse-deco-one-month', 20),
  ('one_year', 'One Year', 'Unlocked with the One Year badge.', 'synapse-deco-one-year', 30),
  ('creator', 'Creator', 'Unlocked after publishing a Workshop creation.', 'synapse-deco-creator', 40),
  ('admin', 'Admin', 'Staff decoration for Admins.', 'synapse-deco-admin', 50),
  ('superadmin', 'Superadmin', 'Staff decoration for the owner.', 'synapse-deco-superadmin', 60)
on conflict (id) do nothing;

create table if not exists public.user_badges (
  uid uuid not null references auth.users (id) on delete cascade,
  badge_id text not null references public.badge_defs (id),
  awarded_at timestamptz not null default now(),
  primary key (uid, badge_id)
);

create table if not exists public.user_decorations (
  uid uuid not null references auth.users (id) on delete cascade,
  decoration_id text not null references public.decoration_defs (id),
  unlocked_at timestamptz not null default now(),
  primary key (uid, decoration_id)
);

alter table public.profiles add column if not exists visibility text not null default 'private';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists equipped_decoration text not null default 'default';
alter table public.profiles add column if not exists featured_badge text not null default '';
alter table public.profiles add column if not exists share_code text;
alter table public.profiles add column if not exists follows_enabled boolean not null default true;
alter table public.profiles add column if not exists default_likes_enabled boolean not null default true;
alter table public.profiles add column if not exists default_comments_enabled boolean not null default true;

alter table public.profiles drop constraint if exists profiles_visibility_check;
alter table public.profiles
  add constraint profiles_visibility_check
  check (visibility in ('public', 'unlisted', 'private'));

alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles
  add constraint profiles_bio_len check (char_length(bio) <= 500);

create table if not exists public.creator_public (
  uid uuid primary key references public.profiles (uid) on delete cascade,
  username text not null unique,
  display_name text not null,
  photo_url text not null default '',
  bio text not null default '',
  equipped_decoration text not null default 'default',
  featured_badge text not null default '',
  visibility text not null default 'private',
  follower_count int not null default 0 check (follower_count >= 0),
  share_code text unique,
  follows_enabled boolean not null default true,
  created_at timestamptz not null
);

alter table public.creator_public add column if not exists share_code text;
alter table public.creator_public add column if not exists follows_enabled boolean not null default true;

create unique index if not exists creator_public_share_code_idx
  on public.creator_public (share_code)
  where share_code is not null;

create table if not exists public.follows (
  follower_uid uuid not null references auth.users (id) on delete cascade,
  followee_uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_uid, followee_uid),
  constraint follows_no_self check (follower_uid <> followee_uid)
);

create index if not exists follows_followee_idx on public.follows (followee_uid);

create table if not exists public.creator_saves (
  uid uuid not null references auth.users (id) on delete cascade,
  creator_uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (uid, creator_uid),
  constraint creator_saves_no_self check (uid <> creator_uid)
);

create table if not exists public.workshop_creations (
  id uuid primary key default gen_random_uuid(),
  creator_uid uuid not null references auth.users (id) on delete cascade,
  creator_username text not null default '',
  creator_display_name text not null default '',
  source_path_id text not null default '' check (char_length(source_path_id) <= 80),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  status text not null default 'active' check (status in ('active', 'pending', 'rejected', 'removed')),
  featured boolean not null default false,
  featured_at timestamptz,
  remix_of uuid,
  like_count int not null default 0 check (like_count >= 0),
  save_count int not null default 0 check (save_count >= 0),
  remix_count int not null default 0 check (remix_count >= 0),
  comment_count int not null default 0 check (comment_count >= 0),
  likes_enabled boolean not null default true,
  comments_enabled boolean not null default true,
  share_code text unique,
  payload jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workshop_payload_shape check (
    jsonb_typeof(payload -> 'nodes') = 'array'
    and jsonb_typeof(coalesce(payload -> 'edges', '[]'::jsonb)) = 'array'
  ),
  constraint workshop_payload_size check (octet_length(payload::text) <= 1500000)
);

alter table public.workshop_creations add column if not exists comment_count int not null default 0;
alter table public.workshop_creations add column if not exists likes_enabled boolean not null default true;
alter table public.workshop_creations add column if not exists comments_enabled boolean not null default true;
alter table public.workshop_creations add column if not exists saves_enabled boolean not null default true;
alter table public.workshop_creations add column if not exists share_code text;
alter table public.workshop_creations add column if not exists share_id text;

alter table public.profiles add column if not exists share_id text;
alter table public.profiles add column if not exists saves_enabled boolean not null default true;
alter table public.creator_public add column if not exists share_id text;
alter table public.creator_public add column if not exists saves_enabled boolean not null default true;

create unique index if not exists workshop_share_code_idx
  on public.workshop_creations (share_code)
  where share_code is not null;

create unique index if not exists workshop_source_path_idx
  on public.workshop_creations (creator_uid, source_path_id)
  where source_path_id <> '';

create index if not exists workshop_public_new_idx
  on public.workshop_creations (published_at desc)
  where visibility = 'public' and status = 'active';

create table if not exists public.workshop_likes (
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (creation_id, uid)
);

create table if not exists public.workshop_saves (
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (creation_id, uid)
);

create table if not exists public.workshop_reports (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  reporter_uid uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'overlay', 'copyright', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewer_uid uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creation_id, reporter_uid)
);

create table if not exists public.workshop_comments (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  username text not null default '',
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists workshop_comments_creation_idx
  on public.workshop_comments (creation_id, created_at desc);

alter table public.moderation drop constraint if exists moderation_type_check;
alter table public.moderation
  add constraint moderation_type_check
  check (type in ('avatar', 'overlay', 'workshop'));
alter table public.moderation
  add column if not exists target_id text not null default '';

-- ---------------------------------------------------------------------------
-- Share codes
-- ---------------------------------------------------------------------------

create or replace function internal.alloc_share_code()
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789abcdefghjkmnpqrstuvwxyz';
  result text;
  i int;
  b int;
begin
  loop
    result := '';
    for i in 1..10 loop
      b := get_byte(gen_random_bytes(1), 0) % 32;
      result := result || substr(alphabet, b + 1, 1);
    end loop;
    exit when
      not exists (select 1 from public.profiles p where p.share_code = result or p.username = result)
      and not exists (select 1 from public.workshop_creations c where c.share_code = result);
  end loop;
  return result;
end;
$$;

create or replace function public.is_superadmin_uid(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = p_uid
      and lower(u.email) = 'dasrony231@gmail.com'
      and u.email_confirmed_at is not null
  );
$$;

revoke execute on function public.is_superadmin_uid(uuid) from public, anon, authenticated;

create or replace function internal.award_badge(p_uid uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_badges (uid, badge_id)
  values (p_uid, p_badge)
  on conflict do nothing;
end;
$$;

create or replace function internal.revoke_badge(p_uid uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_badges
  where uid = p_uid and badge_id = p_badge;
end;
$$;

create or replace function public.assign_profile_share_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.share_code is null or new.share_code = '' then
    new.share_code := internal.alloc_share_code();
  end if;
  new.share_id := new.share_code;
  return new;
end;
$$;

drop trigger if exists profiles_assign_share_code on public.profiles;
create trigger profiles_assign_share_code
before insert or update of share_code on public.profiles
for each row execute function public.assign_profile_share_code();

create or replace function public.assign_creation_share_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.share_code is null or new.share_code = '' then
    new.share_code := internal.alloc_share_code();
  end if;
  new.share_id := new.share_code;
  return new;
end;
$$;

drop trigger if exists workshop_assign_share_code on public.workshop_creations;
create trigger workshop_assign_share_code
before insert on public.workshop_creations
for each row execute function public.assign_creation_share_code();

create or replace function public.sync_creator_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.creator_public (
    uid, username, display_name, photo_url, bio, equipped_decoration,
    featured_badge, visibility, follower_count, share_code, follows_enabled, created_at
  )
  values (
    new.uid, new.username, new.display_name, new.photo_url, new.bio,
    new.equipped_decoration, new.featured_badge, new.visibility, 0,
    new.share_code, coalesce(new.follows_enabled, true), new.created_at
  )
  on conflict (uid) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    photo_url = excluded.photo_url,
    bio = excluded.bio,
    equipped_decoration = excluded.equipped_decoration,
    featured_badge = excluded.featured_badge,
    visibility = excluded.visibility,
    share_code = excluded.share_code,
    follows_enabled = excluded.follows_enabled;

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

drop trigger if exists profiles_sync_creator_public on public.profiles;
create trigger profiles_sync_creator_public
after insert or update of username, display_name, photo_url, bio, equipped_decoration,
  featured_badge, visibility, created_at, share_code, follows_enabled
on public.profiles
for each row execute function public.sync_creator_public();

create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.uid := old.uid;
  new.email := old.email;
  new.created_at := old.created_at;
  if new.share_code is null or new.share_code = '' then
    new.share_code := coalesce(old.share_code, internal.alloc_share_code());
  else
    new.share_code := old.share_code;
  end if;
  if not public.is_staff() then
    new.status := old.status;
    new.photo_url := old.photo_url;
  elsif public.is_admin() and not public.is_superadmin() then
    if lower(old.email) = 'dasrony231@gmail.com'
      or exists (select 1 from public.roles r where r.uid = old.uid) then
      new.status := old.status;
    end if;
  elsif lower(old.email) = 'dasrony231@gmail.com' then
    new.status := old.status;
  end if;
  if coalesce(current_setting('synapse.profile_rpc', true), '') <> '1' then
    new.equipped_decoration := old.equipped_decoration;
    new.featured_badge := old.featured_badge;
    new.follows_enabled := old.follows_enabled;
    new.default_likes_enabled := old.default_likes_enabled;
    new.default_comments_enabled := old.default_comments_enabled;
  end if;
  if new.featured_badge <> '' and not exists (
    select 1 from public.user_badges b
    where b.uid = new.uid and b.badge_id = new.featured_badge
  ) then
    new.featured_badge := old.featured_badge;
  end if;
  new.updated_at := now();
  return new;
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
  select created_at into created from public.profiles where uid = p_uid;
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

create or replace function public.evaluate_own_progress()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  perform internal.evaluate_user_progress(auth.uid());
end;
$$;

create or replace function public.unlock_decoration_for_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deco text;
begin
  deco := case new.badge_id
    when 'one_month' then 'one_month'
    when 'one_year' then 'one_year'
    when 'first_creation' then 'creator'
    when 'admin' then 'admin'
    when 'superadmin' then 'superadmin'
    else null
  end;
  if deco is not null then
    insert into public.user_decorations (uid, decoration_id)
    values (new.uid, deco)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists user_badges_unlock_decoration on public.user_badges;
create trigger user_badges_unlock_decoration
after insert on public.user_badges
for each row execute function public.unlock_decoration_for_badge();

create or replace function public.refresh_follow_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.followee_uid, old.followee_uid);
  update public.creator_public
    set follower_count = (
      select count(*)::int from public.follows where followee_uid = target
    )
    where uid = target;
  perform internal.evaluate_user_progress(target);
  return coalesce(new, old);
end;
$$;

drop trigger if exists follows_refresh_count on public.follows;
create trigger follows_refresh_count
after insert or delete on public.follows
for each row execute function public.refresh_follow_count();

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
  new.share_code := coalesce(old.share_code, new.share_code);
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
    new.share_id := coalesce(old.share_id, old.share_code, new.share_id);
  end if;
  return new;
end;
$$;

drop trigger if exists workshop_creations_touch on public.workshop_creations;
create trigger workshop_creations_touch
before update on public.workshop_creations
for each row execute function public.touch_workshop_creation();

create or replace function public.evaluate_after_workshop_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform internal.evaluate_user_progress(coalesce(new.creator_uid, old.creator_uid));
  return coalesce(new, old);
end;
$$;

drop trigger if exists workshop_creations_evaluate on public.workshop_creations;
create trigger workshop_creations_evaluate
after insert or update of visibility, status, published_at
on public.workshop_creations
for each row execute function public.evaluate_after_workshop_write();

create or replace function public.evaluate_after_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform internal.evaluate_user_progress(coalesce(new.uid, old.uid));
  return coalesce(new, old);
end;
$$;

drop trigger if exists roles_evaluate_badges on public.roles;
create trigger roles_evaluate_badges
after insert or update or delete on public.roles
for each row execute function public.evaluate_after_role_change();

create or replace function public.bump_workshop_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('synapse.workshop_rpc', '1', true);
  if tg_op = 'INSERT' then
    update public.workshop_creations set like_count = like_count + 1 where id = new.creation_id;
    return new;
  end if;
  update public.workshop_creations set like_count = greatest(like_count - 1, 0) where id = old.creation_id;
  return old;
end;
$$;

drop trigger if exists workshop_likes_count on public.workshop_likes;
create trigger workshop_likes_count
after insert or delete on public.workshop_likes
for each row execute function public.bump_workshop_like();

create or replace function public.bump_workshop_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('synapse.workshop_rpc', '1', true);
  if tg_op = 'INSERT' then
    update public.workshop_creations set save_count = save_count + 1 where id = new.creation_id;
    return new;
  end if;
  update public.workshop_creations set save_count = greatest(save_count - 1, 0) where id = old.creation_id;
  return old;
end;
$$;

drop trigger if exists workshop_saves_count on public.workshop_saves;
create trigger workshop_saves_count
after insert or delete on public.workshop_saves
for each row execute function public.bump_workshop_save();

create or replace function public.bump_workshop_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('synapse.workshop_rpc', '1', true);
  if tg_op = 'INSERT' then
    update public.workshop_creations set comment_count = comment_count + 1 where id = new.creation_id;
    return new;
  end if;
  update public.workshop_creations set comment_count = greatest(comment_count - 1, 0) where id = old.creation_id;
  return old;
end;
$$;

drop trigger if exists workshop_comments_count on public.workshop_comments;
create trigger workshop_comments_count
after insert or delete on public.workshop_comments
for each row execute function public.bump_workshop_comment();

create or replace function internal.can_view_creation(r public.workshop_creations)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if r is null then
    return false;
  end if;
  if public.is_staff() or r.creator_uid = auth.uid() then
    return true;
  end if;
  if r.status = 'active' and r.visibility in ('public', 'unlisted') then
    return true;
  end if;
  return false;
end;
$$;

create or replace function internal.resolve_creation(p_id text)
returns public.workshop_creations
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
  key text := lower(trim(coalesce(p_id, '')));
begin
  if key = '' then
    return null;
  end if;
  if key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into r from public.workshop_creations where id = key::uuid;
  else
    select * into r from public.workshop_creations where share_code = key or share_id = key;
  end if;
  if not found then
    return null;
  end if;
  if not internal.can_view_creation(r) then
    return null;
  end if;
  return r;
end;
$$;

create or replace function internal.read_creation(p_id uuid)
returns public.workshop_creations
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return internal.resolve_creation(p_id::text);
end;
$$;

drop function if exists public.get_workshop_creation(uuid);

create or replace function public.get_workshop_creation(p_id text)
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
    return null;
  end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.publish_workshop_creation(
  p_source_path_id text,
  p_title text,
  p_description text,
  p_visibility text,
  p_payload jsonb,
  p_remix_of uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  title text := trim(coalesce(p_title, ''));
  vis text := coalesce(p_visibility, 'private');
  source text := trim(coalesce(p_source_path_id, ''));
  uname text;
  dname text;
  likes_on boolean;
  comments_on boolean;
  existing uuid;
  new_id uuid;
  remix uuid;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if title = '' or char_length(title) > 80 then
    raise exception 'Title must be 1–80 characters';
  end if;
  if char_length(coalesce(p_description, '')) > 500 then
    raise exception 'Description is too long';
  end if;
  if vis not in ('private', 'unlisted', 'public') then
    raise exception 'Invalid visibility';
  end if;
  if jsonb_typeof(p_payload -> 'nodes') is distinct from 'array' then
    raise exception 'Creation payload is invalid';
  end if;
  if octet_length(p_payload::text) > 1500000 then
    raise exception 'Creation is too large';
  end if;

  select username, display_name, default_likes_enabled, default_comments_enabled
    into uname, dname, likes_on, comments_on
  from public.profiles
  where profiles.uid = uid;
  if uname is null then
    raise exception 'Finish creating your account first';
  end if;

  remix := p_remix_of;
  if remix is not null and not exists (
    select 1 from public.workshop_creations c where c.id = remix
  ) then
    remix := null;
  end if;

  perform set_config('synapse.workshop_rpc', '1', true);

  if source <> '' then
    select id into existing
    from public.workshop_creations
    where creator_uid = uid and source_path_id = source;
  end if;

  if existing is not null then
    update public.workshop_creations
      set title = title,
          description = coalesce(p_description, ''),
          visibility = vis,
          payload = p_payload,
          remix_of = coalesce(remix, remix_of),
          creator_username = uname,
          creator_display_name = dname,
          published_at = case
            when vis in ('public', 'unlisted') then coalesce(published_at, now())
            else published_at
          end,
          status = case when status = 'removed' then status else 'active' end
      where id = existing
      returning id into new_id;
    return new_id;
  end if;

  insert into public.workshop_creations (
    creator_uid, creator_username, creator_display_name, source_path_id,
    title, description, visibility, payload, remix_of, published_at,
    likes_enabled, comments_enabled
  )
  values (
    uid, uname, dname, source, title, coalesce(p_description, ''), vis, p_payload, remix,
    case when vis in ('public', 'unlisted') then now() else null end,
    coalesce(likes_on, true), coalesce(comments_on, true)
  )
  returning id into new_id;
  return new_id;
end;
$$;

drop function if exists public.set_workshop_visibility(uuid, text);
create or replace function public.set_workshop_visibility(p_id text, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vis text := coalesce(p_visibility, '');
  r public.workshop_creations;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if vis not in ('private', 'unlisted', 'public') then
    raise exception 'Invalid visibility';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.creator_uid <> auth.uid() then
    raise exception 'Creation not found';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set visibility = vis,
        published_at = case
          when vis in ('public', 'unlisted') then coalesce(published_at, now())
          else published_at
        end
    where id = r.id and status <> 'removed';
end;
$$;

drop function if exists public.toggle_workshop_like(uuid);
create or replace function public.toggle_workshop_like(p_id text)
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
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  if not r.likes_enabled and r.creator_uid <> uid then
    raise exception 'Likes are turned off for this creation';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  delete from public.workshop_likes
  where creation_id = r.id and workshop_likes.uid = uid;
  if found then
    return false;
  end if;
  insert into public.workshop_likes (creation_id, uid) values (r.id, uid);
  return true;
end;
$$;

drop function if exists public.toggle_workshop_save(uuid);
create or replace function public.toggle_workshop_save(p_id text)
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
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  if not r.saves_enabled and r.creator_uid <> uid then
    raise exception 'Saves are turned off for this creation';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  where creation_id = r.id and workshop_saves.uid = uid;
  if found then
    return false;
  end if;
  insert into public.workshop_saves (creation_id, uid) values (r.id, uid);
  return true;
end;
$$;

drop function if exists public.remix_workshop_creation(uuid);
create or replace function public.remix_workshop_creation(p_id text)
returns jsonb
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
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations set remix_count = remix_count + 1 where id = r.id;
  return jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'payload', r.payload,
    'remixOf', r.id,
    'shareCode', r.share_code
  );
end;
$$;

drop function if exists public.report_workshop_creation(uuid, text, text);
create or replace function public.report_workshop_creation(
  p_id text,
  p_reason text,
  p_details text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.workshop_creations;
  reason text := coalesce(p_reason, '');
  details text := trim(coalesce(p_details, ''));
  new_id uuid;
  mod_type text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if reason not in ('spam', 'abuse', 'overlay', 'copyright', 'other') then
    raise exception 'Invalid reason';
  end if;
  if char_length(details) > 500 then
    raise exception 'Details are too long';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null then
    raise exception 'Creation not found';
  end if;
  insert into public.workshop_reports (creation_id, reporter_uid, reason, details)
  values (r.id, uid, reason, details)
  on conflict (creation_id, reporter_uid) do update
    set details = excluded.details,
        reason = excluded.reason,
        status = 'pending',
        updated_at = now()
  returning id into new_id;
  mod_type := case when reason = 'overlay' then 'overlay' else 'workshop' end;
  insert into public.moderation (type, target_uid, target_id, image_url, status, note)
  values (
    mod_type, r.creator_uid, r.id::text, '', 'pending',
    left(reason || case when details = '' then '' else ': ' || details end, 500)
  );
  return new_id;
end;
$$;

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
  if allowed is not true then
    raise exception 'This creator is not accepting followers';
  end if;
  insert into public.follows (follower_uid, followee_uid)
  values (uid, p_uid)
  on conflict do nothing;
end;
$$;

create or replace function public.unfollow_creator(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from public.follows
  where follower_uid = auth.uid() and followee_uid = p_uid;
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

create or replace function public.get_creator(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  key text := lower(trim(coalesce(p_id, '')));
  row public.creator_public;
begin
  if key = '' then
    return null;
  end if;
  select * into row from public.creator_public
  where username = key or share_code = key or share_id = key
  limit 1;
  if not found then
    return null;
  end if;
  if row.visibility = 'private' and row.uid <> auth.uid() and not public.is_staff() then
    return null;
  end if;
  if row.visibility = 'unlisted' and row.username <> key and row.share_code <> key
     and row.share_id <> key
     and row.uid <> auth.uid() and not public.is_staff() then
    return null;
  end if;
  return to_jsonb(row);
end;
$$;

create or replace function public.add_workshop_comment(p_id text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.workshop_creations;
  body text := trim(coalesce(p_body, ''));
  uname text;
  recent int;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if char_length(body) < 1 or char_length(body) > 500 then
    raise exception 'Comment must be 1–500 characters';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
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
  select username into uname from public.profiles where profiles.uid = uid;
  insert into public.workshop_comments (creation_id, uid, username, body)
  values (r.id, uid, coalesce(uname, ''), body)
  returning id into new_id;
  return new_id;
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

create or replace function public.delete_workshop_comment(p_id uuid)
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
  delete from public.workshop_comments c
  using public.workshop_creations w
  where c.id = p_id
    and c.creation_id = w.id
    and (c.uid = uid or w.creator_uid = uid or public.is_staff());
  if not found then
    raise exception 'Comment not found';
  end if;
end;
$$;

drop function if exists public.set_creation_social(text, boolean, boolean);
drop function if exists public.set_creation_social(text, boolean, boolean, boolean);
drop function if exists public.set_creation_social(uuid, boolean, boolean, boolean);

create or replace function public.set_creation_social(
  p_id text,
  p_likes boolean,
  p_comments boolean,
  p_saves boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.creator_uid <> auth.uid() then
    raise exception 'Creation not found';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set likes_enabled = coalesce(p_likes, likes_enabled),
        comments_enabled = coalesce(p_comments, comments_enabled),
        saves_enabled = coalesce(p_saves, saves_enabled)
    where id = r.id;
end;
$$;

drop function if exists public.set_profile_social(boolean, boolean);
drop function if exists public.set_profile_social(boolean, boolean, boolean);
drop function if exists public.set_profile_social(boolean, boolean, boolean, boolean);

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
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles
    set follows_enabled = coalesce(p_follows, follows_enabled),
        default_likes_enabled = coalesce(p_likes, default_likes_enabled),
        default_comments_enabled = coalesce(p_comments, default_comments_enabled),
        saves_enabled = coalesce(p_saves, saves_enabled)
    where uid = auth.uid();
end;
$$;

create or replace function public.list_saved_creations()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(c) order by s.created_at desc)
    from public.workshop_saves s
    join public.workshop_creations c on c.id = s.creation_id
    where s.uid = auth.uid()
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
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(p) order by s.created_at desc)
    from public.creator_saves s
    join public.creator_public p on p.uid = s.creator_uid
    where s.uid = auth.uid()
      and p.visibility in ('public', 'unlisted')
  ), '[]'::jsonb);
end;
$$;

create or replace function public.equip_decoration(p_id text)
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
  if not exists (
    select 1 from public.user_decorations d
    where d.uid = uid and d.decoration_id = p_id
  ) then
    raise exception 'Decoration is locked';
  end if;
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles set equipped_decoration = p_id where profiles.uid = uid;
end;
$$;

create or replace function public.set_featured_badge(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  badge text := coalesce(p_id, '');
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if badge <> '' and not exists (
    select 1 from public.user_badges b
    where b.uid = uid and b.badge_id = badge
  ) then
    raise exception 'You do not have that badge';
  end if;
  perform set_config('synapse.profile_rpc', '1', true);
  update public.profiles set featured_badge = badge where profiles.uid = uid;
end;
$$;

create or replace function public.submit_overlay_for_review(p_image_url text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  url text := trim(coalesce(p_image_url, ''));
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if url = '' or url not like 'https://%' or char_length(url) > 2048 then
    raise exception 'Image URL must be https';
  end if;
  insert into public.moderation (type, target_uid, image_url, status, note)
  values ('overlay', uid, url, 'pending', '')
  returning id into new_id;
  return new_id;
end;
$$;

drop function if exists public.set_workshop_featured(uuid, boolean);
create or replace function public.set_workshop_featured(p_id text, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
begin
  if not public.is_staff() then
    raise exception 'Staff only';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null then
    raise exception 'Creation not found';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set featured = coalesce(p_featured, false),
        featured_at = case when p_featured then now() else null end
    where id = r.id;
end;
$$;

drop function if exists public.set_workshop_status(uuid, text, text);
create or replace function public.set_workshop_status(p_id text, p_status text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  st text := coalesce(p_status, '');
  r public.workshop_creations;
begin
  if not public.is_staff() then
    raise exception 'Staff only';
  end if;
  if st not in ('active', 'pending', 'rejected', 'removed') then
    raise exception 'Invalid status';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null then
    raise exception 'Creation not found';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations set status = st where id = r.id;
  update public.workshop_reports
    set status = 'reviewed',
        reviewer_uid = auth.uid(),
        details = case
          when char_length(trim(coalesce(p_note, ''))) = 0 then details
          else left(details || ' | ' || trim(p_note), 500)
        end,
        updated_at = now()
    where creation_id = r.id and status = 'pending';
end;
$$;

create or replace function public.review_workshop_report(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  st text := coalesce(p_status, '');
begin
  if not public.is_staff() then
    raise exception 'Staff only';
  end if;
  if st not in ('reviewed', 'dismissed') then
    raise exception 'Invalid status';
  end if;
  update public.workshop_reports
    set status = st, reviewer_uid = auth.uid(), updated_at = now()
    where id = p_id;
  if not found then
    raise exception 'Report not found';
  end if;
end;
$$;

create or replace function public.staff_award_badge(p_uid uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  if not exists (select 1 from public.badge_defs d where d.id = p_badge) then
    raise exception 'Unknown badge';
  end if;
  perform internal.award_badge(p_uid, p_badge);
end;
$$;

create or replace function public.staff_revoke_badge(p_uid uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  perform internal.revoke_badge(p_uid, p_badge);
end;
$$;

create or replace function public.staff_grant_decoration(p_uid uuid, p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  insert into public.user_decorations (uid, decoration_id)
  values (p_uid, p_id)
  on conflict do nothing;
end;
$$;

create unique index if not exists profiles_share_code_idx
  on public.profiles (share_code)
  where share_code is not null;

create unique index if not exists profiles_share_id_idx
  on public.profiles (share_id)
  where share_id is not null;

create unique index if not exists workshop_share_id_idx
  on public.workshop_creations (share_id)
  where share_id is not null;

create unique index if not exists creator_public_share_id_idx
  on public.creator_public (share_id)
  where share_id is not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'share_id'
  ) then
    execute $q$
      update public.profiles
      set share_code = share_id
      where (share_code is null or share_code = '') and share_id is not null
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workshop_creations' and column_name = 'share_id'
  ) then
    execute $q$
      update public.workshop_creations
      set share_code = share_id
      where (share_code is null or share_code = '') and share_id is not null
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_public' and column_name = 'share_id'
  ) then
    execute $q$
      update public.creator_public
      set share_code = share_id
      where (share_code is null or share_code = '') and share_id is not null
    $q$;
  end if;
end $$;

update public.profiles
  set share_code = internal.alloc_share_code()
  where share_code is null or share_code = '';

update public.workshop_creations
  set share_code = internal.alloc_share_code()
  where share_code is null or share_code = '';

update public.profiles
  set share_id = share_code
  where share_id is distinct from share_code;
update public.workshop_creations
  set share_id = share_code
  where share_id is distinct from share_code;
update public.creator_public
  set share_id = share_code
  where share_id is distinct from share_code;

insert into public.creator_public (
  uid, username, display_name, photo_url, bio, equipped_decoration,
  featured_badge, visibility, share_code, follows_enabled, created_at
)
select
  uid, username, display_name, photo_url, bio, equipped_decoration,
  featured_badge, visibility, share_code, follows_enabled, created_at
from public.profiles
on conflict (uid) do update set
  share_code = excluded.share_code,
  follows_enabled = excluded.follows_enabled,
  visibility = excluded.visibility;

insert into public.user_decorations (uid, decoration_id)
select uid, 'default' from public.profiles
on conflict do nothing;

alter table public.badge_defs enable row level security;
alter table public.decoration_defs enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_decorations enable row level security;
alter table public.creator_public enable row level security;
alter table public.follows enable row level security;
alter table public.creator_saves enable row level security;
alter table public.workshop_creations enable row level security;
alter table public.workshop_likes enable row level security;
alter table public.workshop_saves enable row level security;
alter table public.workshop_reports enable row level security;
alter table public.workshop_comments enable row level security;

drop policy if exists badge_defs_read on public.badge_defs;
create policy badge_defs_read on public.badge_defs
  for select to anon, authenticated using (true);

drop policy if exists decoration_defs_read on public.decoration_defs;
create policy decoration_defs_read on public.decoration_defs
  for select to anon, authenticated using (true);

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

drop policy if exists creator_public_read on public.creator_public;
create policy creator_public_read on public.creator_public
  for select to anon, authenticated
  using (visibility = 'public' or uid = auth.uid() or public.is_staff());

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows
  for select to authenticated
  using (follower_uid = auth.uid() or followee_uid = auth.uid() or public.is_staff());

drop policy if exists creator_saves_own on public.creator_saves;
create policy creator_saves_own on public.creator_saves
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

drop policy if exists workshop_public_read on public.workshop_creations;
create policy workshop_public_read on public.workshop_creations
  for select to anon, authenticated
  using (visibility = 'public' and status = 'active');

drop policy if exists workshop_owner_read on public.workshop_creations;
create policy workshop_owner_read on public.workshop_creations
  for select to authenticated
  using (creator_uid = auth.uid() or public.is_staff());

drop policy if exists workshop_likes_own on public.workshop_likes;
create policy workshop_likes_own on public.workshop_likes
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

drop policy if exists workshop_saves_own on public.workshop_saves;
create policy workshop_saves_own on public.workshop_saves
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

drop policy if exists workshop_reports_staff on public.workshop_reports;
create policy workshop_reports_staff on public.workshop_reports
  for select to authenticated
  using (public.is_staff() or reporter_uid = auth.uid());

drop policy if exists workshop_comments_read on public.workshop_comments;
create policy workshop_comments_read on public.workshop_comments
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.workshop_creations c
      where c.id = workshop_comments.creation_id
        and (
          (c.visibility = 'public' and c.status = 'active')
          or c.creator_uid = auth.uid()
          or public.is_staff()
        )
    )
  );

grant select on public.badge_defs to anon, authenticated;
grant select on public.decoration_defs to anon, authenticated;
grant select on public.user_badges to anon, authenticated;
grant select on public.user_decorations to anon, authenticated;
grant select on public.creator_public to anon, authenticated;
grant select on public.workshop_creations to anon, authenticated;
grant select on public.workshop_comments to anon, authenticated;
grant select on public.follows to authenticated;
grant select on public.creator_saves to authenticated;
grant select on public.workshop_likes to authenticated;
grant select on public.workshop_saves to authenticated;
grant select on public.workshop_reports to authenticated;

revoke execute on function public.sync_creator_public() from public, anon, authenticated;
revoke execute on function public.assign_profile_share_code() from public, anon, authenticated;
revoke execute on function public.assign_creation_share_code() from public, anon, authenticated;
revoke execute on function public.unlock_decoration_for_badge() from public, anon, authenticated;
revoke execute on function public.refresh_follow_count() from public, anon, authenticated;
revoke execute on function public.touch_workshop_creation() from public, anon, authenticated;
revoke execute on function public.evaluate_after_workshop_write() from public, anon, authenticated;
revoke execute on function public.evaluate_after_role_change() from public, anon, authenticated;
revoke execute on function public.bump_workshop_like() from public, anon, authenticated;
revoke execute on function public.bump_workshop_save() from public, anon, authenticated;
revoke execute on function public.bump_workshop_comment() from public, anon, authenticated;
revoke execute on function public.enforce_profile_update() from public, anon, authenticated;

revoke execute on function public.evaluate_own_progress() from public, anon;
grant execute on function public.evaluate_own_progress() to authenticated;

revoke execute on function public.get_workshop_creation(text) from public;
grant execute on function public.get_workshop_creation(text) to anon, authenticated;

revoke execute on function public.get_creator(text) from public;
grant execute on function public.get_creator(text) to anon, authenticated;

revoke execute on function public.list_workshop_comments(text) from public;
grant execute on function public.list_workshop_comments(text) to anon, authenticated;

revoke execute on function public.publish_workshop_creation(text, text, text, text, jsonb, uuid) from public, anon;
grant execute on function public.publish_workshop_creation(text, text, text, text, jsonb, uuid) to authenticated;

revoke execute on function public.set_workshop_visibility(text, text) from public, anon;
grant execute on function public.set_workshop_visibility(text, text) to authenticated;

revoke execute on function public.toggle_workshop_like(text) from public, anon;
grant execute on function public.toggle_workshop_like(text) to authenticated;

revoke execute on function public.toggle_workshop_save(text) from public, anon;
grant execute on function public.toggle_workshop_save(text) to authenticated;

revoke execute on function public.remix_workshop_creation(text) from public, anon;
grant execute on function public.remix_workshop_creation(text) to authenticated;

revoke execute on function public.report_workshop_creation(text, text, text) from public, anon;
grant execute on function public.report_workshop_creation(text, text, text) to authenticated;

revoke execute on function public.follow_creator(uuid) from public, anon;
grant execute on function public.follow_creator(uuid) to authenticated;

revoke execute on function public.unfollow_creator(uuid) from public, anon;
grant execute on function public.unfollow_creator(uuid) to authenticated;

revoke execute on function public.toggle_creator_save(uuid) from public, anon;
grant execute on function public.toggle_creator_save(uuid) to authenticated;

revoke execute on function public.add_workshop_comment(text, text) from public, anon;
grant execute on function public.add_workshop_comment(text, text) to authenticated;

revoke execute on function public.delete_workshop_comment(uuid) from public, anon;
grant execute on function public.delete_workshop_comment(uuid) to authenticated;

revoke execute on function public.set_creation_social(text, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_creation_social(text, boolean, boolean, boolean) to authenticated;

revoke execute on function public.set_profile_social(boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_profile_social(boolean, boolean, boolean, boolean) to authenticated;

revoke execute on function public.list_saved_creations() from public, anon;
grant execute on function public.list_saved_creations() to authenticated;

revoke execute on function public.list_saved_creators() from public, anon;
grant execute on function public.list_saved_creators() to authenticated;

create or replace function public.list_saved_workshop()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.list_saved_creations();
$$;

revoke execute on function public.list_saved_workshop() from public, anon;
grant execute on function public.list_saved_workshop() to authenticated;

create or replace function public.resolve_share(p_ref text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  key text := lower(trim(coalesce(p_ref, '')));
  creation public.workshop_creations;
  creator public.creator_public;
begin
  if key = '' then
    return null;
  end if;
  creation := internal.resolve_creation(key);
  if creation is not null then
    return jsonb_build_object(
      'kind', 'playlist',
      'id', creation.id,
      'shareCode', creation.share_code,
      'shareId', coalesce(creation.share_code, creation.share_id),
      'path', '/p/' || coalesce(creation.share_code, creation.share_id)
    );
  end if;
  select * into creator from public.creator_public
  where username = key or share_code = key or share_id = key
  limit 1;
  if found and (
    creator.visibility in ('public', 'unlisted')
    or creator.uid = auth.uid()
    or public.is_staff()
  ) then
    return jsonb_build_object(
      'kind', 'user',
      'id', creator.uid,
      'shareCode', coalesce(creator.share_code, creator.share_id),
      'shareId', coalesce(creator.share_code, creator.share_id),
      'username', creator.username,
      'path', '/u/' || coalesce(nullif(creator.username, ''), creator.share_code, creator.share_id)
    );
  end if;
  return null;
end;
$$;

revoke execute on function public.resolve_share(text) from public;
grant execute on function public.resolve_share(text) to anon, authenticated;

revoke execute on function public.equip_decoration(text) from public, anon;
grant execute on function public.equip_decoration(text) to authenticated;

revoke execute on function public.set_featured_badge(text) from public, anon;
grant execute on function public.set_featured_badge(text) to authenticated;

revoke execute on function public.submit_overlay_for_review(text) from public, anon;
grant execute on function public.submit_overlay_for_review(text) to authenticated;

revoke execute on function public.set_workshop_featured(text, boolean) from public, anon;
grant execute on function public.set_workshop_featured(text, boolean) to authenticated;

revoke execute on function public.set_workshop_status(text, text, text) from public, anon;
grant execute on function public.set_workshop_status(text, text, text) to authenticated;

revoke execute on function public.review_workshop_report(uuid, text) from public, anon;
grant execute on function public.review_workshop_report(uuid, text) to authenticated;

revoke execute on function public.staff_award_badge(uuid, text) from public, anon;
grant execute on function public.staff_award_badge(uuid, text) to authenticated;

revoke execute on function public.staff_revoke_badge(uuid, text) from public, anon;
grant execute on function public.staff_revoke_badge(uuid, text) to authenticated;

revoke execute on function public.staff_grant_decoration(uuid, text) from public, anon;
grant execute on function public.staff_grant_decoration(uuid, text) to authenticated;

grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

notify pgrst, 'reload schema';
