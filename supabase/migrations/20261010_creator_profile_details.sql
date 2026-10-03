-- Public /u/ pages read location, genres, songs, playlists, and listen stats
-- from user_workspaces without exposing the rest of the workspace.

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
