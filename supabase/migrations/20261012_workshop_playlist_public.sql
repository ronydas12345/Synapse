-- Public playlist pages, republish freshness, and remix lookup.
-- Share IDs live on workshop_creations.share_id (there is no share_code column).
-- publish_workshop_creation previously assigned title = title, which is a no-op
-- because the PL/pgSQL variable shadows the column.

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
    select * into r from public.workshop_creations where share_id = key;
  end if;
  if not found or not internal.can_view_creation(r) then
    return null;
  end if;
  return r;
end;
$$;

drop function if exists public.remix_workshop_creation(uuid);
drop function if exists public.list_workshop_comments(uuid);

create or replace function public.remix_workshop_creation(p_id text)
returns jsonb
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
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set remix_count = remix_count + 1
    where id = r.id;
  return jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'payload', r.payload,
    'remixOf', r.id,
    'shareCode', r.share_id,
    'kind', r.kind,
    'tags', to_jsonb(r.tags)
  );
end;
$$;

grant execute on function public.remix_workshop_creation(text) to authenticated;
revoke execute on function public.remix_workshop_creation(text) from public, anon;

create or replace function public.search_workshop(
  p_query text default '',
  p_kind text default '',
  p_tags text[] default '{}'
)
returns setof public.workshop_creations
language plpgsql
stable
set search_path = public
as $$
declare
  q text := left(replace(replace(trim(coalesce(p_query, '')), '%', ''), '_', ''), 80);
  filter_kind text := coalesce(nullif(trim(p_kind), ''), '');
  chosen text[] := coalesce(p_tags, '{}');
begin
  if filter_kind not in ('', 'all', 'playlist', 'theme') then
    filter_kind := '';
  end if;
  return query
  select c.*
  from public.workshop_creations c
  where c.visibility = 'public'
    and c.status = 'active'
    and (filter_kind in ('', 'all') or c.kind = filter_kind)
    and (chosen = '{}' or c.tags && chosen)
    and (
      q = ''
      or c.title ilike '%' || q || '%'
      or c.description ilike '%' || q || '%'
      or c.creator_username ilike '%' || q || '%'
      or c.creator_display_name ilike '%' || q || '%'
      or exists (
        select 1
        from public.workshop_tag_defs d
        where d.kind = c.kind
          and d.id = any (c.tags)
          and (d.id ilike '%' || q || '%' or d.label ilike '%' || q || '%')
      )
    )
  order by c.updated_at desc nulls last, c.published_at desc nulls last
  limit 60;
end;
$$;

grant execute on function public.search_workshop(text, text, text[]) to anon, authenticated;

create or replace function public.publish_workshop_creation(
  p_source_path_id text,
  p_title text,
  p_description text,
  p_visibility text,
  p_payload jsonb,
  p_remix_of uuid default null,
  p_kind text default 'playlist',
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  next_title text := trim(coalesce(p_title, ''));
  vis text := coalesce(p_visibility, 'private');
  source text := trim(coalesce(p_source_path_id, ''));
  creation_kind text := coalesce(
    nullif(trim(p_kind), ''),
    case
      when trim(coalesce(p_source_path_id, '')) like 'theme:%' then 'theme'
      else 'playlist'
    end
  );
  chosen text[] := internal.normalize_workshop_tags(creation_kind, p_tags);
  uname text;
  dname text;
  likes_on boolean;
  comments_on boolean;
  existing uuid;
  new_id uuid;
  remix uuid;
  theme_id text;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if creation_kind not in ('playlist', 'theme') then
    raise exception 'Invalid creation type';
  end if;
  if next_title = '' or char_length(next_title) > 80 then
    raise exception 'Title must be 1–80 characters';
  end if;
  if char_length(coalesce(p_description, '')) > 500 then
    raise exception 'Description is too long';
  end if;
  if vis not in ('private', 'unlisted', 'public') then
    raise exception 'Invalid visibility';
  end if;
  if creation_kind = 'playlist' and jsonb_typeof(p_payload -> 'nodes') is distinct from 'array' then
    raise exception 'Creation payload is invalid';
  end if;
  if creation_kind = 'theme' and coalesce(p_payload->>'type', '') <> 'synapse-theme' then
    raise exception 'Theme payload is invalid';
  end if;
  if octet_length(p_payload::text) > 1500000 then
    raise exception 'Creation is too large';
  end if;

  if creation_kind = 'theme' then
    theme_id := coalesce(p_payload->>'id', '');
    if coalesce(p_payload->>'builtin', 'false') in ('true', 't')
       or theme_id in (
         'standard-dark', 'standard-light', 'high-contrast-light', 'high-contrast-dark',
         'ocean-blue', 'bold-blue', 'leaf-green', 'pretty-pink', 'cherry-tree',
         'blood-red', 'sunset-orange', 'purple-night', 'lavender', 'forest',
         'deep-ocean', 'midnight', 'cyberpunk', 'synthwave', 'monochrome',
         'warm-cream', 'solarized-light', 'solarized-dark', 'rose', 'mint', 'amber', 'neon'
       )
       or source in (
         'theme:standard-dark', 'theme:standard-light', 'theme:high-contrast-light',
         'theme:high-contrast-dark', 'theme:ocean-blue', 'theme:bold-blue',
         'theme:leaf-green', 'theme:pretty-pink', 'theme:cherry-tree',
         'theme:blood-red', 'theme:sunset-orange', 'theme:purple-night',
         'theme:lavender', 'theme:forest', 'theme:deep-ocean', 'theme:midnight',
         'theme:cyberpunk', 'theme:synthwave', 'theme:monochrome',
         'theme:warm-cream', 'theme:solarized-light', 'theme:solarized-dark',
         'theme:rose', 'theme:mint', 'theme:amber', 'theme:neon'
       )
    then
      raise exception 'Default themes cannot be published';
    end if;
  end if;

  select username, display_name,
         coalesce(default_likes_enabled, true),
         coalesce(default_comments_enabled, true)
    into uname, dname, likes_on, comments_on
  from public.profiles
  where profiles.uid = viewer;
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
    where creator_uid = viewer and source_path_id = source;
  end if;

  if existing is not null then
    update public.workshop_creations
      set title = next_title,
          description = coalesce(p_description, ''),
          visibility = vis,
          payload = p_payload,
          kind = creation_kind,
          tags = chosen,
          remix_of = coalesce(remix, remix_of),
          creator_username = uname,
          creator_display_name = dname,
          published_at = case
            when vis in ('public', 'unlisted') then now()
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
    likes_enabled, comments_enabled, kind, tags
  )
  values (
    viewer, uname, dname, source, next_title, coalesce(p_description, ''), vis, p_payload, remix,
    case when vis in ('public', 'unlisted') then now() else null end,
    coalesce(likes_on, true), coalesce(comments_on, true), creation_kind, chosen
  )
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.publish_workshop_creation(text, text, text, text, jsonb, uuid, text, text[]) to authenticated;
notify pgrst, 'reload schema';
