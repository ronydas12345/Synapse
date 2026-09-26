-- Workshop, badges, decorations, follows, reports.
-- Badge rows are written only by SECURITY DEFINER functions (never client inserts).

create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalogs
-- ---------------------------------------------------------------------------

create table public.badge_defs (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null check (char_length(name) between 1 and 40),
  description text not null check (char_length(description) between 1 and 200),
  category text not null check (category in ('account', 'creator', 'community', 'staff')),
  sort_order int not null default 0
);

create table public.decoration_defs (
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
  ('followers_100', '100 Followers', 'Reached 100 followers.', 'community', 100);

insert into public.decoration_defs (id, name, description, css_class, sort_order) values
  ('default', 'Default', 'Standard profile frame.', 'synapse-deco-default', 10),
  ('one_month', 'One Month', 'Unlocked with the One Month badge.', 'synapse-deco-one-month', 20),
  ('one_year', 'One Year', 'Unlocked with the One Year badge.', 'synapse-deco-one-year', 30),
  ('creator', 'Creator', 'Unlocked after publishing a Workshop creation.', 'synapse-deco-creator', 40),
  ('admin', 'Admin', 'Staff decoration for Admins.', 'synapse-deco-admin', 50),
  ('superadmin', 'Superadmin', 'Staff decoration for the owner.', 'synapse-deco-superadmin', 60);

create table public.user_badges (
  uid uuid not null references auth.users (id) on delete cascade,
  badge_id text not null references public.badge_defs (id),
  awarded_at timestamptz not null default now(),
  primary key (uid, badge_id)
);

create index user_badges_badge_idx on public.user_badges (badge_id);

create table public.user_decorations (
  uid uuid not null references auth.users (id) on delete cascade,
  decoration_id text not null references public.decoration_defs (id),
  unlocked_at timestamptz not null default now(),
  primary key (uid, decoration_id)
);

-- ---------------------------------------------------------------------------
-- Public-safe creator cards (no email)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists visibility text not null default 'private'
    check (visibility in ('public', 'private')),
  add column if not exists bio text not null default ''
    check (char_length(bio) <= 500),
  add column if not exists equipped_decoration text not null default 'default'
    references public.decoration_defs (id),
  add column if not exists featured_badge text not null default ''
    check (featured_badge = '' or char_length(featured_badge) <= 40);

create table public.creator_public (
  uid uuid primary key references public.profiles (uid) on delete cascade,
  username text not null unique,
  display_name text not null,
  photo_url text not null default '',
  bio text not null default '',
  equipped_decoration text not null default 'default',
  featured_badge text not null default '',
  visibility text not null default 'private',
  follower_count int not null default 0 check (follower_count >= 0),
  created_at timestamptz not null
);

create table public.follows (
  follower_uid uuid not null references auth.users (id) on delete cascade,
  followee_uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_uid, followee_uid),
  constraint follows_no_self check (follower_uid <> followee_uid)
);

create index follows_followee_idx on public.follows (followee_uid);

create table public.workshop_creations (
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
  remix_of uuid references public.workshop_creations (id) on delete set null,
  like_count int not null default 0 check (like_count >= 0),
  save_count int not null default 0 check (save_count >= 0),
  remix_count int not null default 0 check (remix_count >= 0),
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

create unique index workshop_source_path_idx
  on public.workshop_creations (creator_uid, source_path_id)
  where source_path_id <> '';

create index workshop_public_new_idx
  on public.workshop_creations (published_at desc)
  where visibility = 'public' and status = 'active';

create index workshop_public_featured_idx
  on public.workshop_creations (featured_at desc)
  where visibility = 'public' and status = 'active' and featured = true;

create index workshop_creator_idx on public.workshop_creations (creator_uid, updated_at desc);

create table public.workshop_likes (
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (creation_id, uid)
);

create table public.workshop_saves (
  creation_id uuid not null references public.workshop_creations (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (creation_id, uid)
);

create table public.workshop_reports (
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

create index workshop_reports_status_idx on public.workshop_reports (status, created_at desc);

alter table public.moderation drop constraint if exists moderation_type_check;
alter table public.moderation
  add constraint moderation_type_check
  check (type in ('avatar', 'overlay', 'workshop'));
alter table public.moderation
  add column if not exists target_id text not null default ''
  check (char_length(target_id) <= 128);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

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

create or replace function public.sync_creator_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.creator_public (
    uid, username, display_name, photo_url, bio, equipped_decoration,
    featured_badge, visibility, created_at
  )
  values (
    new.uid, new.username, new.display_name, new.photo_url, new.bio,
    new.equipped_decoration, new.featured_badge, new.visibility, new.created_at
  )
  on conflict (uid) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    photo_url = excluded.photo_url,
    bio = excluded.bio,
    equipped_decoration = excluded.equipped_decoration,
    featured_badge = excluded.featured_badge,
    visibility = excluded.visibility;

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

create trigger profiles_sync_creator_public
after insert or update of username, display_name, photo_url, bio, equipped_decoration, featured_badge, visibility, created_at
on public.profiles
for each row execute function public.sync_creator_public();

insert into public.creator_public (
  uid, username, display_name, photo_url, bio, equipped_decoration,
  featured_badge, visibility, created_at
)
select
  uid, username, display_name, photo_url, bio, equipped_decoration,
  featured_badge, visibility, created_at
from public.profiles
on conflict (uid) do nothing;

insert into public.user_decorations (uid, decoration_id)
select uid, 'default' from public.profiles
on conflict do nothing;

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

create trigger user_badges_unlock_decoration
after insert on public.user_badges
for each row execute function public.unlock_decoration_for_badge();

create or replace function public.reset_decoration_on_badge_revoke()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deco text;
begin
  deco := case old.badge_id
    when 'one_month' then 'one_month'
    when 'one_year' then 'one_year'
    when 'first_creation' then 'creator'
    when 'admin' then 'admin'
    when 'superadmin' then 'superadmin'
    else null
  end;
  if deco is not null and old.badge_id in ('admin', 'superadmin') then
    delete from public.user_decorations
    where uid = old.uid and decoration_id = deco;
    update public.profiles
      set equipped_decoration = 'default'
      where uid = old.uid and equipped_decoration = deco;
  end if;
  return old;
end;
$$;

create trigger user_badges_reset_decoration
after delete on public.user_badges
for each row execute function public.reset_decoration_on_badge_revoke();

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
  if public_uploads >= 10 then
    perform internal.award_badge(p_uid, 'uploads_10');
  end if;
  if public_uploads >= 25 then
    perform internal.award_badge(p_uid, 'uploads_25');
  end if;
  if public_uploads >= 100 then
    perform internal.award_badge(p_uid, 'uploads_100');
  end if;

  select count(*)::int into followers
  from public.follows f
  where f.followee_uid = p_uid;
  if followers >= 10 then
    perform internal.award_badge(p_uid, 'followers_10');
  end if;
  if followers >= 100 then
    perform internal.award_badge(p_uid, 'followers_100');
  end if;

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
  new.updated_at := now();
  if coalesce(current_setting('synapse.workshop_rpc', true), '') <> '1' then
    new.featured := old.featured;
    new.featured_at := old.featured_at;
    new.status := old.status;
    new.like_count := old.like_count;
    new.save_count := old.save_count;
    new.remix_count := old.remix_count;
  end if;
  return new;
end;
$$;

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
    update public.workshop_creations
      set like_count = like_count + 1
      where id = new.creation_id;
    return new;
  end if;
  update public.workshop_creations
    set like_count = greatest(like_count - 1, 0)
    where id = old.creation_id;
  return old;
end;
$$;

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
    update public.workshop_creations
      set save_count = save_count + 1
      where id = new.creation_id;
    return new;
  end if;
  update public.workshop_creations
    set save_count = greatest(save_count - 1, 0)
    where id = old.creation_id;
  return old;
end;
$$;

create trigger workshop_saves_count
after insert or delete on public.workshop_saves
for each row execute function public.bump_workshop_save();

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

create or replace function internal.read_creation(p_id uuid)
returns public.workshop_creations
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
begin
  select * into r from public.workshop_creations where id = p_id;
  if not found then
    return null;
  end if;
  if not internal.can_view_creation(r) then
    return null;
  end if;
  return r;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.get_workshop_creation(p_id uuid)
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

  select username, display_name into uname, dname
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
    title, description, visibility, payload, remix_of, published_at
  )
  values (
    uid, uname, dname, source, title, coalesce(p_description, ''), vis, p_payload, remix,
    case when vis in ('public', 'unlisted') then now() else null end
  )
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.set_workshop_visibility(p_id uuid, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vis text := coalesce(p_visibility, '');
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if vis not in ('private', 'unlisted', 'public') then
    raise exception 'Invalid visibility';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set visibility = vis,
        published_at = case
          when vis in ('public', 'unlisted') then coalesce(published_at, now())
          else published_at
        end
    where id = p_id and creator_uid = auth.uid() and status <> 'removed';
  if not found then
    raise exception 'Creation not found';
  end if;
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
  liked boolean;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  r := internal.read_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
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

create or replace function public.remix_workshop_creation(p_id uuid)
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
  r := internal.read_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility = 'private' then
    raise exception 'Creation not found';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set remix_count = remix_count + 1
    where id = p_id;
  return jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'payload', r.payload,
    'remixOf', r.id
  );
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
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if p_uid is null or p_uid = uid then
    raise exception 'Cannot follow that account';
  end if;
  if not exists (select 1 from public.profiles p where p.uid = p_uid and p.status = 'active') then
    raise exception 'Account not found';
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

create or replace function public.report_workshop_creation(
  p_id uuid,
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
  r := internal.read_creation(p_id);
  if r is null then
    raise exception 'Creation not found';
  end if;
  insert into public.workshop_reports (creation_id, reporter_uid, reason, details)
  values (p_id, uid, reason, details)
  on conflict (creation_id, reporter_uid) do update
    set details = excluded.details,
        reason = excluded.reason,
        status = 'pending',
        updated_at = now()
  returning id into new_id;

  mod_type := case when reason = 'overlay' then 'overlay' else 'workshop' end;
  insert into public.moderation (type, target_uid, target_id, image_url, status, note)
  values (
    mod_type,
    r.creator_uid,
    p_id::text,
    '',
    'pending',
    left(reason || case when details = '' then '' else ': ' || details end, 500)
  );
  return new_id;
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
  update public.profiles
    set equipped_decoration = p_id
    where profiles.uid = uid;
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
  update public.profiles
    set featured_badge = badge
    where profiles.uid = uid;
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

create or replace function public.set_workshop_featured(p_id uuid, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Staff only';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set featured = coalesce(p_featured, false),
        featured_at = case when p_featured then now() else null end
    where id = p_id;
  if not found then
    raise exception 'Creation not found';
  end if;
end;
$$;

create or replace function public.set_workshop_status(p_id uuid, p_status text, p_note text default '')
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
  if st not in ('active', 'pending', 'rejected', 'removed') then
    raise exception 'Invalid status';
  end if;
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set status = st
    where id = p_id;
  if not found then
    raise exception 'Creation not found';
  end if;
  update public.workshop_reports
    set status = 'reviewed',
        reviewer_uid = auth.uid(),
        details = case
          when char_length(trim(coalesce(p_note, ''))) = 0 then details
          else left(details || ' | ' || trim(p_note), 500)
        end,
        updated_at = now()
    where creation_id = p_id and status = 'pending';
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
    set status = st,
        reviewer_uid = auth.uid(),
        updated_at = now()
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.badge_defs enable row level security;
alter table public.decoration_defs enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_decorations enable row level security;
alter table public.creator_public enable row level security;
alter table public.follows enable row level security;
alter table public.workshop_creations enable row level security;
alter table public.workshop_likes enable row level security;
alter table public.workshop_saves enable row level security;
alter table public.workshop_reports enable row level security;

create policy badge_defs_read on public.badge_defs
  for select to anon, authenticated using (true);

create policy decoration_defs_read on public.decoration_defs
  for select to anon, authenticated using (true);

create policy user_badges_read on public.user_badges
  for select to anon, authenticated
  using (
    uid = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.creator_public c
      where c.uid = user_badges.uid and c.visibility = 'public'
    )
  );

create policy user_decorations_read on public.user_decorations
  for select to anon, authenticated
  using (
    uid = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.creator_public c
      where c.uid = user_decorations.uid and c.visibility = 'public'
    )
  );

create policy creator_public_read on public.creator_public
  for select to anon, authenticated
  using (visibility = 'public' or uid = auth.uid() or public.is_staff());

create policy follows_read on public.follows
  for select to authenticated
  using (follower_uid = auth.uid() or followee_uid = auth.uid() or public.is_staff());

create policy workshop_public_read on public.workshop_creations
  for select to anon, authenticated
  using (visibility = 'public' and status = 'active');

create policy workshop_owner_read on public.workshop_creations
  for select to authenticated
  using (creator_uid = auth.uid() or public.is_staff());

create policy workshop_likes_own on public.workshop_likes
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

create policy workshop_saves_own on public.workshop_saves
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

create policy workshop_reports_staff on public.workshop_reports
  for select to authenticated
  using (public.is_staff() or reporter_uid = auth.uid());

grant select on public.badge_defs to anon, authenticated;
grant select on public.decoration_defs to anon, authenticated;
grant select on public.user_badges to anon, authenticated;
grant select on public.user_decorations to anon, authenticated;
grant select on public.creator_public to anon, authenticated;
grant select on public.workshop_creations to anon, authenticated;
grant select on public.follows to authenticated;
grant select on public.workshop_likes to authenticated;
grant select on public.workshop_saves to authenticated;
grant select on public.workshop_reports to authenticated;

revoke execute on function public.sync_creator_public() from public, anon, authenticated;
revoke execute on function public.unlock_decoration_for_badge() from public, anon, authenticated;
revoke execute on function public.reset_decoration_on_badge_revoke() from public, anon, authenticated;
revoke execute on function public.refresh_follow_count() from public, anon, authenticated;
revoke execute on function public.touch_workshop_creation() from public, anon, authenticated;
revoke execute on function public.evaluate_after_workshop_write() from public, anon, authenticated;
revoke execute on function public.evaluate_after_role_change() from public, anon, authenticated;
revoke execute on function public.bump_workshop_like() from public, anon, authenticated;
revoke execute on function public.bump_workshop_save() from public, anon, authenticated;
revoke execute on function public.enforce_profile_update() from public, anon, authenticated;

revoke execute on function public.evaluate_own_progress() from public, anon;
grant execute on function public.evaluate_own_progress() to authenticated;

revoke execute on function public.get_workshop_creation(uuid) from public;
grant execute on function public.get_workshop_creation(uuid) to anon, authenticated;

revoke execute on function public.publish_workshop_creation(text, text, text, text, jsonb, uuid) from public, anon;
grant execute on function public.publish_workshop_creation(text, text, text, text, jsonb, uuid) to authenticated;

revoke execute on function public.set_workshop_visibility(uuid, text) from public, anon;
grant execute on function public.set_workshop_visibility(uuid, text) to authenticated;

revoke execute on function public.toggle_workshop_like(uuid) from public, anon;
grant execute on function public.toggle_workshop_like(uuid) to authenticated;

revoke execute on function public.toggle_workshop_save(uuid) from public, anon;
grant execute on function public.toggle_workshop_save(uuid) to authenticated;

revoke execute on function public.remix_workshop_creation(uuid) from public, anon;
grant execute on function public.remix_workshop_creation(uuid) to authenticated;

revoke execute on function public.follow_creator(uuid) from public, anon;
grant execute on function public.follow_creator(uuid) to authenticated;

revoke execute on function public.unfollow_creator(uuid) from public, anon;
grant execute on function public.unfollow_creator(uuid) to authenticated;

revoke execute on function public.report_workshop_creation(uuid, text, text) from public, anon;
grant execute on function public.report_workshop_creation(uuid, text, text) to authenticated;

revoke execute on function public.equip_decoration(text) from public, anon;
grant execute on function public.equip_decoration(text) to authenticated;

revoke execute on function public.set_featured_badge(text) from public, anon;
grant execute on function public.set_featured_badge(text) to authenticated;

revoke execute on function public.submit_overlay_for_review(text) from public, anon;
grant execute on function public.submit_overlay_for_review(text) to authenticated;

revoke execute on function public.set_workshop_featured(uuid, boolean) from public, anon;
grant execute on function public.set_workshop_featured(uuid, boolean) to authenticated;

revoke execute on function public.set_workshop_status(uuid, text, text) from public, anon;
grant execute on function public.set_workshop_status(uuid, text, text) to authenticated;

revoke execute on function public.review_workshop_report(uuid, text) from public, anon;
grant execute on function public.review_workshop_report(uuid, text) to authenticated;

revoke execute on function public.staff_award_badge(uuid, text) from public, anon;
grant execute on function public.staff_award_badge(uuid, text) to authenticated;

revoke execute on function public.staff_revoke_badge(uuid, text) from public, anon;
grant execute on function public.staff_revoke_badge(uuid, text) to authenticated;

revoke execute on function public.staff_grant_decoration(uuid, text) from public, anon;
grant execute on function public.staff_grant_decoration(uuid, text) to authenticated;
