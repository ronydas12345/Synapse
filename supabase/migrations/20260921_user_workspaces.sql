-- Per-user workspace data (paths, settings, themes, profile extras, tutorial)
-- plus avatar storage and owner-submitted profile-picture moderation.

create table public.user_workspaces (
  uid uuid primary key references auth.users (id) on delete cascade,
  library jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  profile jsonb not null default '{}'::jsonb,
  tutorial jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_workspaces_library_size check (octet_length(library::text) <= 1500000),
  constraint user_workspaces_settings_size check (octet_length(settings::text) <= 100000),
  constraint user_workspaces_theme_size check (octet_length(theme::text) <= 500000),
  constraint user_workspaces_profile_size check (octet_length(profile::text) <= 200000),
  constraint user_workspaces_tutorial_size check (octet_length(tutorial::text) <= 20000)
);

alter table public.user_workspaces enable row level security;

create policy user_workspaces_select on public.user_workspaces
  for select to authenticated
  using (uid = auth.uid());

create policy user_workspaces_insert on public.user_workspaces
  for insert to authenticated
  with check (uid = auth.uid());

create policy user_workspaces_update on public.user_workspaces
  for update to authenticated
  using (uid = auth.uid())
  with check (uid = auth.uid());

create or replace function public.touch_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.uid := old.uid;
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_workspaces_touch
before update on public.user_workspaces
for each row execute function public.touch_user_workspace();

revoke execute on function public.touch_user_workspace() from public, anon, authenticated;

-- Owners cannot self-approve a profile photo. Staff still can via RLS.
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
  new.updated_at := now();
  return new;
end;
$$;

create index if not exists moderation_target_idx
  on public.moderation (target_uid, type, status);

create policy moderation_owner_select on public.moderation
  for select to authenticated
  using (target_uid = auth.uid());

create or replace function public.submit_avatar_for_review(p_image_url text)
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
  update public.moderation
    set status = 'rejected',
        note = 'Replaced by a newer profile picture.',
        updated_at = now()
    where target_uid = uid
      and type = 'avatar'
      and status = 'pending';
  insert into public.moderation (type, target_uid, image_url, status, note)
  values ('avatar', uid, url, 'pending', '')
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.submit_avatar_for_review(text) from public, anon;
grant execute on function public.submit_avatar_for_review(text) to authenticated;

create or replace function public.clear_own_avatar()
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
  update public.profiles
    set photo_url = ''
    where profiles.uid = uid;
  update public.moderation
    set status = 'removed',
        note = 'Removed by the account owner.',
        updated_at = now()
    where target_uid = uid
      and type = 'avatar'
      and status in ('pending', 'approved');
end;
$$;

revoke execute on function public.clear_own_avatar() from public, anon;
grant execute on function public.clear_own_avatar() to authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  insert into public.data_subject_requests (uid, request_type, status, summary, completed_at)
  values (uid, 'erase', 'completed', 'Account deleted by the user.', now());
  delete from storage.objects
    where bucket_id = 'avatars'
      and name like uid::text || '/%';
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;
drop policy if exists avatars_select_public on storage.objects;

create policy avatars_select_public on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.is_staff()
    )
  )
  with check (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.is_staff()
    )
  );

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.is_staff()
    )
  );
