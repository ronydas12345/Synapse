-- Profile extras (location, genres, songs, sections, listens) used to live
-- only in user_workspaces.profile JSON. Hydrate disabled persist, empty
-- profiles.bio wiped the blob, and /u/ stayed empty after reload.
-- Store extras on profiles and write them through an RPC, same as visibility.

alter table public.profiles
  add column if not exists profile_extras jsonb;

create or replace function public.set_profile_extras(p_extras jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  next_extras jsonb := coalesce(p_extras, '{}'::jsonb);
  next_bio text;
  updated int := 0;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if jsonb_typeof(next_extras) <> 'object' then
    raise exception 'Invalid extras';
  end if;
  if octet_length(next_extras::text) > 100000 then
    raise exception 'Profile details are too long';
  end if;

  next_bio := left(coalesce(next_extras->>'bio', ''), 500);

  perform set_config('synapse.profile_rpc', '1', true);

  update public.profiles
    set profile_extras = next_extras,
        bio = next_bio
  where profiles.uid = viewer;
  get diagnostics updated = row_count;
  if updated = 0 then
    raise exception 'Finish creating your account first';
  end if;

  update public.creator_public
    set bio = next_bio
  where creator_public.uid = viewer;
end;
$$;

revoke execute on function public.set_profile_extras(jsonb) from public, anon;
grant execute on function public.set_profile_extras(jsonb) to authenticated;

update public.profiles p
set profile_extras = w.profile
from public.user_workspaces w
where w.uid = p.uid
  and p.profile_extras is null
  and w.profile is not null
  and w.profile <> '{}'::jsonb
  and (
    coalesce(w.profile->>'location', '') <> ''
    or coalesce(w.profile->>'bio', '') <> ''
    or (
      jsonb_typeof(w.profile->'favoriteGenres') = 'array'
      and jsonb_array_length(w.profile->'favoriteGenres') > 0
    )
    or (
      jsonb_typeof(w.profile->'favoriteSongs') = 'array'
      and jsonb_array_length(w.profile->'favoriteSongs') > 0
    )
    or (
      jsonb_typeof(w.profile->'hiddenSections') = 'array'
      and jsonb_array_length(w.profile->'hiddenSections') > 0
    )
    or coalesce((w.profile->>'totalListens')::int, 0) > 0
  );

update public.profiles p
set bio = left(coalesce(p.profile_extras->>'bio', w.profile->>'bio', p.bio), 500)
from public.user_workspaces w
where w.uid = p.uid
  and coalesce(p.bio, '') = ''
  and coalesce(p.profile_extras->>'bio', w.profile->>'bio', '') <> '';

create or replace function public.get_creator_profile_details(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ref text := lower(trim(coalesce(p_id, '')));
  target uuid;
  vis text;
  payload jsonb := '{}'::jsonb;
  lib jsonb := '{}'::jsonb;
  stored_extras jsonb;
  hidden jsonb := '[]'::jsonb;
  is_owner boolean := false;
  playlists jsonb := '[]'::jsonb;
  show_location boolean := true;
  show_bio boolean := true;
  show_genres boolean := true;
  show_songs boolean := true;
  show_playlists boolean := true;
  show_stats boolean := true;
begin
  if ref = '' then
    return null;
  end if;

  select p.uid, p.visibility
    into target, vis
  from public.profiles p
  where p.username = ref or p.share_id = ref
  limit 1;

  if target is null then
    select c.uid, c.visibility
      into target, vis
    from public.creator_public c
    where c.username = ref or c.share_id = ref
    limit 1;
  end if;

  if target is null then
    return null;
  end if;

  is_owner := auth.uid() = target or public.is_staff();
  if vis not in ('public', 'unlisted') and not is_owner then
    return null;
  end if;

  select w.profile, w.library
    into payload, lib
  from public.user_workspaces w
  where w.uid = target;

  payload := coalesce(payload, '{}'::jsonb);
  lib := coalesce(lib, '{}'::jsonb);

  select p.profile_extras
    into stored_extras
  from public.profiles p
  where p.uid = target;

  if stored_extras is not null and stored_extras <> '{}'::jsonb then
    payload := stored_extras;
  end if;
  hidden := coalesce(payload->'hiddenSections', '[]'::jsonb);

  if jsonb_typeof(hidden) <> 'array' then
    hidden := '[]'::jsonb;
  end if;

  show_location := is_owner or not (hidden ? 'location');
  show_bio := is_owner or not (hidden ? 'bio');
  show_genres := is_owner or not (hidden ? 'genres');
  show_songs := is_owner or not (hidden ? 'songs');
  show_playlists := is_owner or not (hidden ? 'playlists');
  show_stats := is_owner or not ((hidden ? 'stats') and (hidden ? 'activity'));

  if jsonb_typeof(lib->'paths') = 'array' then
    playlists := coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', path->>'id',
        'name', path->>'name',
        'visibility', coalesce(path->>'visibility', 'private')
      ))
      from jsonb_array_elements(lib->'paths') as path
      where coalesce(path->>'name', '') <> ''
        and (is_owner or path->>'visibility' = 'public')
    ), '[]'::jsonb);
  elsif jsonb_typeof(payload->'playlists') = 'array' then
    playlists := coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', path->>'id',
        'name', path->>'name',
        'visibility', coalesce(path->>'visibility', 'private')
      ))
      from jsonb_array_elements(payload->'playlists') as path
      where coalesce(path->>'name', '') <> ''
        and (is_owner or path->>'visibility' = 'public')
    ), '[]'::jsonb);
  end if;

  if not show_playlists then
    playlists := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'location', case when show_location then coalesce(payload->>'location', '') else '' end,
    'locationLat', case
      when show_location then payload->'locationLat'
      else 'null'::jsonb
    end,
    'locationLon', case
      when show_location then payload->'locationLon'
      else 'null'::jsonb
    end,
    'bio', case when show_bio then coalesce(payload->>'bio', '') else '' end,
    'favoriteGenres', case
      when show_genres then coalesce(payload->'favoriteGenres', '[]'::jsonb)
      else '[]'::jsonb
    end,
    'favoriteSongs', case
      when show_songs then coalesce(payload->'favoriteSongs', '[]'::jsonb)
      else '[]'::jsonb
    end,
    'playlists', playlists,
    'sectionOrder', coalesce(payload->'sectionOrder', '[]'::jsonb),
    'hiddenSections', hidden,
    'createdAt', payload->>'createdAt',
    'totalListens', case
      when show_stats then coalesce(payload->'totalListens', '0'::jsonb)
      else '0'::jsonb
    end,
    'listensByDay', case
      when show_stats then coalesce(payload->'listensByDay', '{}'::jsonb)
      else '{}'::jsonb
    end
  );
end;
$$;

revoke execute on function public.get_creator_profile_details(text) from public;
grant execute on function public.get_creator_profile_details(text) to anon, authenticated;
notify pgrst, 'reload schema';
