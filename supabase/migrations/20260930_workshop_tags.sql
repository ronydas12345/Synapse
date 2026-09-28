-- Curated Workshop tags for playlists and themes.
-- Users pick from workshop_tag_defs; they cannot invent tags.

alter table public.workshop_creations
  add column if not exists kind text not null default 'playlist';

alter table public.workshop_creations
  add column if not exists tags text[] not null default '{}';

update public.workshop_creations
  set kind = 'playlist'
  where kind is null or kind = '';

alter table public.workshop_creations
  drop constraint if exists workshop_creations_kind_check;

alter table public.workshop_creations
  add constraint workshop_creations_kind_check
  check (kind in ('playlist', 'theme'));

alter table public.workshop_creations
  drop constraint if exists workshop_tags_limit;

alter table public.workshop_creations
  add constraint workshop_tags_limit
  check (cardinality(tags) <= 8);

alter table public.workshop_creations
  drop constraint if exists workshop_payload_shape;

alter table public.workshop_creations
  add constraint workshop_payload_shape check (
    (
      kind = 'playlist'
      and jsonb_typeof(payload -> 'nodes') = 'array'
      and jsonb_typeof(coalesce(payload -> 'edges', '[]'::jsonb)) = 'array'
    )
    or (
      kind = 'theme'
      and payload->>'type' = 'synapse-theme'
    )
  );

create table if not exists public.workshop_tag_defs (
  kind text not null check (kind in ('playlist', 'theme')),
  id text not null check (id ~ '^[a-z0-9][a-z0-9-]{1,31}$'),
  category text not null check (char_length(category) between 1 and 32),
  label text not null check (char_length(label) between 1 and 40),
  sort_order int not null default 0,
  active boolean not null default true,
  primary key (kind, id)
);

create index if not exists workshop_tag_defs_cat_idx
  on public.workshop_tag_defs (kind, category, sort_order);

create index if not exists workshop_public_kind_idx
  on public.workshop_creations (kind, published_at desc)
  where visibility = 'public' and status = 'active';

create index if not exists workshop_tags_gin
  on public.workshop_creations using gin (tags);

alter table public.workshop_tag_defs enable row level security;

drop policy if exists workshop_tag_defs_read on public.workshop_tag_defs;
create policy workshop_tag_defs_read on public.workshop_tag_defs
  for select to anon, authenticated
  using (true);

drop policy if exists workshop_tag_defs_staff on public.workshop_tag_defs;
create policy workshop_tag_defs_staff on public.workshop_tag_defs
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select on public.workshop_tag_defs to anon, authenticated;

create or replace function internal.normalize_workshop_tags(p_kind text, p_tags text[])
returns text[]
language plpgsql
stable
set search_path = public
as $$
declare
  kept text[] := '{}';
  item text;
  normalized text;
begin
  if p_kind not in ('playlist', 'theme') then
    return '{}';
  end if;
  if p_tags is null then
    return '{}';
  end if;
  foreach item in array p_tags loop
    normalized := lower(trim(coalesce(item, '')));
    if normalized = '' then
      continue;
    end if;
    if normalized = any(kept) then
      continue;
    end if;
    if exists (
      select 1 from public.workshop_tag_defs d
      where d.kind = p_kind and d.id = normalized and d.active
    ) then
      kept := kept || normalized;
    end if;
    if cardinality(kept) >= 8 then
      exit;
    end if;
  end loop;
  return kept;
end;
$$;

drop function if exists public.publish_workshop_creation(text, text, text, text, jsonb, uuid);
drop function if exists public.publish_workshop_creation(text, text, text, text, jsonb, uuid, text, text[]);

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
  title text := trim(coalesce(p_title, ''));
  vis text := coalesce(p_visibility, 'private');
  source text := trim(coalesce(p_source_path_id, ''));
  creation_kind text := coalesce(nullif(trim(p_kind), ''), 'playlist');
  chosen text[] := internal.normalize_workshop_tags(creation_kind, p_tags);
  uname text;
  dname text;
  likes_on boolean;
  comments_on boolean;
  existing uuid;
  new_id uuid;
  remix uuid;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if creation_kind not in ('playlist', 'theme') then
    raise exception 'Invalid creation type';
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
  if creation_kind = 'playlist' and jsonb_typeof(p_payload -> 'nodes') is distinct from 'array' then
    raise exception 'Creation payload is invalid';
  end if;
  if creation_kind = 'theme' and coalesce(p_payload->>'type', '') <> 'synapse-theme' then
    raise exception 'Theme payload is invalid';
  end if;
  if octet_length(p_payload::text) > 1500000 then
    raise exception 'Creation is too large';
  end if;

  select username, display_name, default_likes_enabled, default_comments_enabled
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
      set title = title,
          description = coalesce(p_description, ''),
          visibility = vis,
          payload = p_payload,
          kind = creation_kind,
          tags = chosen,
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
    likes_enabled, comments_enabled, kind, tags
  )
  values (
    viewer, uname, dname, source, title, coalesce(p_description, ''), vis, p_payload, remix,
    case when vis in ('public', 'unlisted') then now() else null end,
    coalesce(likes_on, true), coalesce(comments_on, true), creation_kind, chosen
  )
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.set_workshop_tags(p_id text, p_tags text[])
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  r public.workshop_creations;
  chosen text[];
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.creator_uid <> viewer then
    raise exception 'Creation not found';
  end if;
  chosen := internal.normalize_workshop_tags(r.kind, p_tags);
  perform set_config('synapse.workshop_rpc', '1', true);
  update public.workshop_creations
    set tags = chosen
    where id = r.id;
  return chosen;
end;
$$;

create or replace function public.staff_remove_workshop_tag(p_id text, p_tag text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.workshop_creations;
  tag_id text := lower(trim(coalesce(p_tag, '')));
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
    set tags = array_remove(tags, tag_id)
    where id = r.id;
  insert into public.admin_audit (actor_uid, actor_email, action, target_type, target_id, summary)
  select auth.uid(), p.email, 'workshop.tag.remove', 'workshop', r.id::text, 'Removed tag ' || tag_id
  from public.profiles p
  where p.uid = auth.uid();
end;
$$;

create or replace function public.search_workshop(
  p_query text default '',
  p_kind text default '',
  p_tags text[] default '{}'
)
returns setof public.workshop_creations
language plpgsql
stable
security invoker
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
  order by c.published_at desc nulls last
  limit 60;
end;
$$;

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
  update public.workshop_creations set remix_count = remix_count + 1 where id = r.id;
  return jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'payload', r.payload,
    'remixOf', r.id,
    'shareCode', r.share_code,
    'kind', r.kind,
    'tags', to_jsonb(r.tags)
  );
end;
$$;

grant execute on function public.publish_workshop_creation(text, text, text, text, jsonb, uuid, text, text[]) to authenticated;
grant execute on function public.set_workshop_tags(text, text[]) to authenticated;
grant execute on function public.staff_remove_workshop_tag(text, text) to authenticated;
grant execute on function public.search_workshop(text, text, text[]) to anon, authenticated;
grant execute on function public.remix_workshop_creation(text) to authenticated;

insert into public.workshop_tag_defs (kind, id, category, label, sort_order)
select kind, id, category, label, ord
from jsonb_to_recordset($seed$[{"kind":"playlist","id":"rock","category":"genre","label":"Rock","ord":0},{"kind":"playlist","id":"pop","category":"genre","label":"Pop","ord":1},{"kind":"playlist","id":"metal","category":"genre","label":"Metal","ord":2},{"kind":"playlist","id":"punk","category":"genre","label":"Punk","ord":3},{"kind":"playlist","id":"indie","category":"genre","label":"Indie","ord":4},{"kind":"playlist","id":"alternative","category":"genre","label":"Alternative","ord":5},{"kind":"playlist","id":"folk","category":"genre","label":"Folk","ord":6},{"kind":"playlist","id":"country","category":"genre","label":"Country","ord":7},{"kind":"playlist","id":"blues","category":"genre","label":"Blues","ord":8},{"kind":"playlist","id":"jazz","category":"genre","label":"Jazz","ord":9},{"kind":"playlist","id":"soul","category":"genre","label":"Soul","ord":10},{"kind":"playlist","id":"rnb","category":"genre","label":"R&B","ord":11},{"kind":"playlist","id":"funk","category":"genre","label":"Funk","ord":12},{"kind":"playlist","id":"disco","category":"genre","label":"Disco","ord":13},{"kind":"playlist","id":"hip-hop","category":"genre","label":"Hip-hop","ord":14},{"kind":"playlist","id":"rap","category":"genre","label":"Rap","ord":15},{"kind":"playlist","id":"trap","category":"genre","label":"Trap","ord":16},{"kind":"playlist","id":"electronic","category":"genre","label":"Electronic","ord":17},{"kind":"playlist","id":"edm","category":"genre","label":"EDM","ord":18},{"kind":"playlist","id":"house","category":"genre","label":"House","ord":19},{"kind":"playlist","id":"techno","category":"genre","label":"Techno","ord":20},{"kind":"playlist","id":"trance","category":"genre","label":"Trance","ord":21},{"kind":"playlist","id":"dnb","category":"genre","label":"Drum & bass","ord":22},{"kind":"playlist","id":"dubstep","category":"genre","label":"Dubstep","ord":23},{"kind":"playlist","id":"ambient","category":"genre","label":"Ambient","ord":24},{"kind":"playlist","id":"lo-fi","category":"genre","label":"Lo-fi","ord":25},{"kind":"playlist","id":"idm","category":"genre","label":"IDM","ord":26},{"kind":"playlist","id":"synthwave","category":"genre","label":"Synthwave","ord":27},{"kind":"playlist","id":"vaporwave","category":"genre","label":"Vaporwave","ord":28},{"kind":"playlist","id":"classical","category":"genre","label":"Classical","ord":29},{"kind":"playlist","id":"orchestral","category":"genre","label":"Orchestral","ord":30},{"kind":"playlist","id":"opera","category":"genre","label":"Opera","ord":31},{"kind":"playlist","id":"choir","category":"genre","label":"Choir","ord":32},{"kind":"playlist","id":"soundtrack","category":"genre","label":"Soundtrack","ord":33},{"kind":"playlist","id":"ost","category":"genre","label":"OST","ord":34},{"kind":"playlist","id":"instrumental","category":"genre","label":"Instrumental","ord":35},{"kind":"playlist","id":"acoustic","category":"genre","label":"Acoustic","ord":36},{"kind":"playlist","id":"piano","category":"genre","label":"Piano","ord":37},{"kind":"playlist","id":"guitar","category":"genre","label":"Guitar","ord":38},{"kind":"playlist","id":"world","category":"genre","label":"World","ord":39},{"kind":"playlist","id":"latin","category":"genre","label":"Latin","ord":40},{"kind":"playlist","id":"reggaeton","category":"genre","label":"Reggaeton","ord":41},{"kind":"playlist","id":"reggae","category":"genre","label":"Reggae","ord":42},{"kind":"playlist","id":"ska","category":"genre","label":"Ska","ord":43},{"kind":"playlist","id":"afrobeats","category":"genre","label":"Afrobeats","ord":44},{"kind":"playlist","id":"k-pop","category":"genre","label":"K-pop","ord":45},{"kind":"playlist","id":"j-pop","category":"genre","label":"J-pop","ord":46},{"kind":"playlist","id":"j-rock","category":"genre","label":"J-rock","ord":47},{"kind":"playlist","id":"city-pop","category":"genre","label":"City pop","ord":48},{"kind":"playlist","id":"c-pop","category":"genre","label":"C-pop","ord":49},{"kind":"playlist","id":"bollywood","category":"genre","label":"Bollywood","ord":50},{"kind":"playlist","id":"gospel","category":"genre","label":"Gospel","ord":51},{"kind":"playlist","id":"christian","category":"genre","label":"Christian","ord":52},{"kind":"playlist","id":"new-age","category":"genre","label":"New age","ord":53},{"kind":"playlist","id":"experimental","category":"genre","label":"Experimental","ord":54},{"kind":"playlist","id":"noise","category":"genre","label":"Noise","ord":55},{"kind":"playlist","id":"industrial","category":"genre","label":"Industrial","ord":56},{"kind":"playlist","id":"goth","category":"genre","label":"Goth","ord":57},{"kind":"playlist","id":"emo","category":"genre","label":"Emo","ord":58},{"kind":"playlist","id":"hardcore","category":"genre","label":"Hardcore","ord":59},{"kind":"playlist","id":"post-rock","category":"genre","label":"Post-rock","ord":60},{"kind":"playlist","id":"shoegaze","category":"genre","label":"Shoegaze","ord":61},{"kind":"playlist","id":"dream-pop","category":"genre","label":"Dream pop","ord":62},{"kind":"playlist","id":"garage","category":"genre","label":"Garage","ord":63},{"kind":"playlist","id":"grunge","category":"genre","label":"Grunge","ord":64},{"kind":"playlist","id":"prog","category":"genre","label":"Prog","ord":65},{"kind":"playlist","id":"psychedelic","category":"genre","label":"Psychedelic","ord":66},{"kind":"playlist","id":"soca","category":"genre","label":"Soca","ord":67},{"kind":"playlist","id":"dancehall","category":"genre","label":"Dancehall","ord":68},{"kind":"playlist","id":"bossa","category":"genre","label":"Bossa nova","ord":69},{"kind":"playlist","id":"samba","category":"genre","label":"Samba","ord":70},{"kind":"playlist","id":"tango","category":"genre","label":"Tango","ord":71},{"kind":"playlist","id":"flamenco","category":"genre","label":"Flamenco","ord":72},{"kind":"playlist","id":"celtic","category":"genre","label":"Celtic","ord":73},{"kind":"playlist","id":"bluegrass","category":"genre","label":"Bluegrass","ord":74},{"kind":"playlist","id":"americana","category":"genre","label":"Americana","ord":75},{"kind":"playlist","id":"singer-songwriter","category":"genre","label":"Singer-songwriter","ord":76},{"kind":"playlist","id":"chillwave","category":"genre","label":"Chillwave","ord":77},{"kind":"playlist","id":"phonk","category":"genre","label":"Phonk","ord":78},{"kind":"playlist","id":"hyperpop","category":"genre","label":"Hyperpop","ord":79},{"kind":"playlist","id":"breakcore","category":"genre","label":"Breakcore","ord":80},{"kind":"playlist","id":"jungle","category":"genre","label":"Jungle","ord":81},{"kind":"playlist","id":"uk-garage","category":"genre","label":"UK garage","ord":82},{"kind":"playlist","id":"grime","category":"genre","label":"Grime","ord":83},{"kind":"playlist","id":"drill","category":"genre","label":"Drill","ord":84},{"kind":"playlist","id":"chill","category":"mood","label":"Chill","ord":85},{"kind":"playlist","id":"calm","category":"mood","label":"Calm","ord":86},{"kind":"playlist","id":"cozy","category":"mood","label":"Cozy","ord":87},{"kind":"playlist","id":"warm","category":"mood","label":"Warm","ord":88},{"kind":"playlist","id":"sad","category":"mood","label":"Sad","ord":89},{"kind":"playlist","id":"melancholy","category":"mood","label":"Melancholy","ord":90},{"kind":"playlist","id":"happy","category":"mood","label":"Happy","ord":91},{"kind":"playlist","id":"uplifting","category":"mood","label":"Uplifting","ord":92},{"kind":"playlist","id":"energetic","category":"mood","label":"Energetic","ord":93},{"kind":"playlist","id":"aggressive","category":"mood","label":"Aggressive","ord":94},{"kind":"playlist","id":"dark","category":"mood","label":"Dark","ord":95},{"kind":"playlist","id":"dreamy","category":"mood","label":"Dreamy","ord":96},{"kind":"playlist","id":"romantic","category":"mood","label":"Romantic","ord":97},{"kind":"playlist","id":"nostalgic","category":"mood","label":"Nostalgic","ord":98},{"kind":"playlist","id":"eerie","category":"mood","label":"Eerie","ord":99},{"kind":"playlist","id":"hopeful","category":"mood","label":"Hopeful","ord":100},{"kind":"playlist","id":"angry","category":"mood","label":"Angry","ord":101},{"kind":"playlist","id":"playful","category":"mood","label":"Playful","ord":102},{"kind":"playlist","id":"epic","category":"mood","label":"Epic","ord":103},{"kind":"playlist","id":"cinematic","category":"mood","label":"Cinematic","ord":104},{"kind":"playlist","id":"mysterious","category":"mood","label":"Mysterious","ord":105},{"kind":"playlist","id":"peaceful","category":"mood","label":"Peaceful","ord":106},{"kind":"playlist","id":"intense","category":"mood","label":"Intense","ord":107},{"kind":"playlist","id":"bittersweet","category":"mood","label":"Bittersweet","ord":108},{"kind":"playlist","id":"hypnotic","category":"mood","label":"Hypnotic","ord":109},{"kind":"playlist","id":"glitchy","category":"mood","label":"Glitchy","ord":110},{"kind":"playlist","id":"spacey","category":"mood","label":"Spacey","ord":111},{"kind":"playlist","id":"rainy","category":"mood","label":"Rainy","ord":112},{"kind":"playlist","id":"night","category":"mood","label":"Night","ord":113},{"kind":"playlist","id":"morning","category":"mood","label":"Morning","ord":114},{"kind":"playlist","id":"sunset","category":"mood","label":"Sunset","ord":115},{"kind":"playlist","id":"summer","category":"mood","label":"Summer","ord":116},{"kind":"playlist","id":"winter","category":"mood","label":"Winter","ord":117},{"kind":"playlist","id":"autumn","category":"mood","label":"Autumn","ord":118},{"kind":"playlist","id":"spring","category":"mood","label":"Spring","ord":119},{"kind":"playlist","id":"focus","category":"activity","label":"Focus","ord":120},{"kind":"playlist","id":"study","category":"activity","label":"Study","ord":121},{"kind":"playlist","id":"coding","category":"activity","label":"Coding","ord":122},{"kind":"playlist","id":"work","category":"activity","label":"Work","ord":123},{"kind":"playlist","id":"reading","category":"activity","label":"Reading","ord":124},{"kind":"playlist","id":"sleep","category":"activity","label":"Sleep","ord":125},{"kind":"playlist","id":"workout","category":"activity","label":"Workout","ord":126},{"kind":"playlist","id":"running","category":"activity","label":"Running","ord":127},{"kind":"playlist","id":"gym","category":"activity","label":"Gym","ord":128},{"kind":"playlist","id":"yoga","category":"activity","label":"Yoga","ord":129},{"kind":"playlist","id":"meditation","category":"activity","label":"Meditation","ord":130},{"kind":"playlist","id":"party","category":"activity","label":"Party","ord":131},{"kind":"playlist","id":"dance","category":"activity","label":"Dance","ord":132},{"kind":"playlist","id":"driving","category":"activity","label":"Driving","ord":133},{"kind":"playlist","id":"commute","category":"activity","label":"Commute","ord":134},{"kind":"playlist","id":"cooking","category":"activity","label":"Cooking","ord":135},{"kind":"playlist","id":"cleaning","category":"activity","label":"Cleaning","ord":136},{"kind":"playlist","id":"gaming","category":"activity","label":"Gaming","ord":137},{"kind":"playlist","id":"streaming","category":"activity","label":"Streaming","ord":138},{"kind":"playlist","id":"writing","category":"activity","label":"Writing","ord":139},{"kind":"playlist","id":"drawing","category":"activity","label":"Drawing","ord":140},{"kind":"playlist","id":"walking","category":"activity","label":"Walking","ord":141},{"kind":"playlist","id":"travel","category":"activity","label":"Travel","ord":142},{"kind":"playlist","id":"background","category":"activity","label":"Background","ord":143},{"kind":"playlist","id":"anime","category":"media","label":"Anime","ord":144},{"kind":"playlist","id":"manga","category":"media","label":"Manga","ord":145},{"kind":"playlist","id":"game","category":"media","label":"Game","ord":146},{"kind":"playlist","id":"movie","category":"media","label":"Movie","ord":147},{"kind":"playlist","id":"tv","category":"media","label":"TV","ord":148},{"kind":"playlist","id":"musical","category":"media","label":"Musical","ord":149},{"kind":"playlist","id":"vocaloid","category":"media","label":"Vocaloid","ord":150},{"kind":"playlist","id":"touhou","category":"media","label":"Touhou","ord":151},{"kind":"playlist","id":"rhythm-game","category":"media","label":"Rhythm game","ord":152},{"kind":"playlist","id":"visual-novel","category":"media","label":"Visual novel","ord":153},{"kind":"playlist","id":"jrpg","category":"media","label":"JRPG","ord":154},{"kind":"playlist","id":"rpg","category":"media","label":"RPG","ord":155},{"kind":"playlist","id":"indie-game","category":"media","label":"Indie game","ord":156},{"kind":"playlist","id":"arcade","category":"media","label":"Arcade","ord":157},{"kind":"playlist","id":"retro-game","category":"media","label":"Retro game","ord":158},{"kind":"playlist","id":"cartoon","category":"media","label":"Cartoon","ord":159},{"kind":"playlist","id":"documentary","category":"media","label":"Documentary","ord":160},{"kind":"playlist","id":"trailer","category":"media","label":"Trailer","ord":161},{"kind":"playlist","id":"commercial","category":"media","label":"Commercial","ord":162},{"kind":"playlist","id":"radio","category":"media","label":"Radio","ord":163},{"kind":"playlist","id":"podcast-safe","category":"media","label":"Podcast-safe","ord":164},{"kind":"playlist","id":"covers","category":"media","label":"Covers","ord":165},{"kind":"playlist","id":"remixes","category":"media","label":"Remixes","ord":166},{"kind":"playlist","id":"mashup","category":"media","label":"Mashup","ord":167},{"kind":"playlist","id":"live","category":"media","label":"Live","ord":168},{"kind":"playlist","id":"concert","category":"media","label":"Concert","ord":169},{"kind":"playlist","id":"karaoke","category":"media","label":"Karaoke","ord":170},{"kind":"playlist","id":"choir-arr","category":"media","label":"Choral arrangement","ord":171},{"kind":"playlist","id":"50s","category":"era","label":"1950s","ord":172},{"kind":"playlist","id":"60s","category":"era","label":"1960s","ord":173},{"kind":"playlist","id":"70s","category":"era","label":"1970s","ord":174},{"kind":"playlist","id":"80s","category":"era","label":"1980s","ord":175},{"kind":"playlist","id":"90s","category":"era","label":"1990s","ord":176},{"kind":"playlist","id":"2000s","category":"era","label":"2000s","ord":177},{"kind":"playlist","id":"2010s","category":"era","label":"2010s","ord":178},{"kind":"playlist","id":"2020s","category":"era","label":"2020s","ord":179},{"kind":"playlist","id":"vintage","category":"era","label":"Vintage","ord":180},{"kind":"playlist","id":"retro","category":"era","label":"Retro","ord":181},{"kind":"playlist","id":"modern","category":"era","label":"Modern","ord":182},{"kind":"playlist","id":"classic","category":"era","label":"Classic","ord":183},{"kind":"playlist","id":"oldies","category":"era","label":"Oldies","ord":184},{"kind":"playlist","id":"timeless","category":"era","label":"Timeless","ord":185},{"kind":"playlist","id":"vocals","category":"voice","label":"Vocals","ord":186},{"kind":"playlist","id":"no-vocals","category":"voice","label":"No vocals","ord":187},{"kind":"playlist","id":"female-vocals","category":"voice","label":"Female vocals","ord":188},{"kind":"playlist","id":"male-vocals","category":"voice","label":"Male vocals","ord":189},{"kind":"playlist","id":"duet","category":"voice","label":"Duet","ord":190},{"kind":"playlist","id":"acapella","category":"voice","label":"A cappella","ord":191},{"kind":"playlist","id":"spoken","category":"voice","label":"Spoken word","ord":192},{"kind":"playlist","id":"multilingual","category":"voice","label":"Multilingual","ord":193},{"kind":"playlist","id":"english","category":"voice","label":"English","ord":194},{"kind":"playlist","id":"japanese","category":"voice","label":"Japanese","ord":195},{"kind":"playlist","id":"korean","category":"voice","label":"Korean","ord":196},{"kind":"playlist","id":"spanish","category":"voice","label":"Spanish","ord":197},{"kind":"playlist","id":"french","category":"voice","label":"French","ord":198},{"kind":"playlist","id":"german","category":"voice","label":"German","ord":199},{"kind":"playlist","id":"portuguese","category":"voice","label":"Portuguese","ord":200},{"kind":"playlist","id":"chinese","category":"voice","label":"Chinese","ord":201},{"kind":"playlist","id":"cafe","category":"scene","label":"Cafe","ord":202},{"kind":"playlist","id":"late-night","category":"scene","label":"Late night","ord":203},{"kind":"playlist","id":"city","category":"scene","label":"City","ord":204},{"kind":"playlist","id":"nature","category":"scene","label":"Nature","ord":205},{"kind":"playlist","id":"beach","category":"scene","label":"Beach","ord":206},{"kind":"playlist","id":"rain-window","category":"scene","label":"Rain window","ord":207},{"kind":"playlist","id":"library","category":"scene","label":"Library","ord":208},{"kind":"playlist","id":"office","category":"scene","label":"Office","ord":209},{"kind":"playlist","id":"festival","category":"scene","label":"Festival","ord":210},{"kind":"playlist","id":"club","category":"scene","label":"Club","ord":211},{"kind":"playlist","id":"road-trip","category":"scene","label":"Road trip","ord":212},{"kind":"playlist","id":"holiday","category":"scene","label":"Holiday","ord":213},{"kind":"playlist","id":"christmas","category":"scene","label":"Christmas","ord":214},{"kind":"playlist","id":"halloween","category":"scene","label":"Halloween","ord":215},{"kind":"playlist","id":"new-year","category":"scene","label":"New year","ord":216},{"kind":"playlist","id":"rainy-day","category":"scene","label":"Rainy day","ord":217},{"kind":"playlist","id":"sunny","category":"scene","label":"Sunny","ord":218},{"kind":"playlist","id":"after-hours","category":"scene","label":"After hours","ord":219},{"kind":"playlist","id":"warmup","category":"scene","label":"Warmup","ord":220},{"kind":"playlist","id":"cooldown-mix","category":"scene","label":"Cooldown mix","ord":221},{"kind":"playlist","id":"opens","category":"scene","label":"Opens","ord":222},{"kind":"playlist","id":"closes","category":"scene","label":"Closes","ord":223},{"kind":"theme","id":"dark","category":"palette","label":"Dark","ord":224},{"kind":"theme","id":"light","category":"palette","label":"Light","ord":225},{"kind":"theme","id":"black","category":"palette","label":"Black","ord":226},{"kind":"theme","id":"white","category":"palette","label":"White","ord":227},{"kind":"theme","id":"gray","category":"palette","label":"Gray","ord":228},{"kind":"theme","id":"monochrome","category":"palette","label":"Monochrome","ord":229},{"kind":"theme","id":"pink","category":"palette","label":"Pink","ord":230},{"kind":"theme","id":"red","category":"palette","label":"Red","ord":231},{"kind":"theme","id":"orange","category":"palette","label":"Orange","ord":232},{"kind":"theme","id":"amber","category":"palette","label":"Amber","ord":233},{"kind":"theme","id":"yellow","category":"palette","label":"Yellow","ord":234},{"kind":"theme","id":"gold","category":"palette","label":"Gold","ord":235},{"kind":"theme","id":"green","category":"palette","label":"Green","ord":236},{"kind":"theme","id":"mint","category":"palette","label":"Mint","ord":237},{"kind":"theme","id":"teal","category":"palette","label":"Teal","ord":238},{"kind":"theme","id":"cyan","category":"palette","label":"Cyan","ord":239},{"kind":"theme","id":"blue","category":"palette","label":"Blue","ord":240},{"kind":"theme","id":"navy","category":"palette","label":"Navy","ord":241},{"kind":"theme","id":"indigo","category":"palette","label":"Indigo","ord":242},{"kind":"theme","id":"purple","category":"palette","label":"Purple","ord":243},{"kind":"theme","id":"violet","category":"palette","label":"Violet","ord":244},{"kind":"theme","id":"lavender","category":"palette","label":"Lavender","ord":245},{"kind":"theme","id":"magenta","category":"palette","label":"Magenta","ord":246},{"kind":"theme","id":"rose","category":"palette","label":"Rose","ord":247},{"kind":"theme","id":"brown","category":"palette","label":"Brown","ord":248},{"kind":"theme","id":"cream","category":"palette","label":"Cream","ord":249},{"kind":"theme","id":"ivory","category":"palette","label":"Ivory","ord":250},{"kind":"theme","id":"pastel","category":"palette","label":"Pastel","ord":251},{"kind":"theme","id":"neon","category":"palette","label":"Neon","ord":252},{"kind":"theme","id":"muted","category":"palette","label":"Muted","ord":253},{"kind":"theme","id":"warm","category":"palette","label":"Warm","ord":254},{"kind":"theme","id":"cool","category":"palette","label":"Cool","ord":255},{"kind":"theme","id":"earth","category":"palette","label":"Earth","ord":256},{"kind":"theme","id":"sunset-color","category":"palette","label":"Sunset","ord":257},{"kind":"theme","id":"ocean-color","category":"palette","label":"Ocean","ord":258},{"kind":"theme","id":"forest-color","category":"palette","label":"Forest","ord":259},{"kind":"theme","id":"blood-red","category":"palette","label":"Blood red","ord":260},{"kind":"theme","id":"ice","category":"palette","label":"Ice","ord":261},{"kind":"theme","id":"sand","category":"palette","label":"Sand","ord":262},{"kind":"theme","id":"copper","category":"palette","label":"Copper","ord":263},{"kind":"theme","id":"cute","category":"style","label":"Cute","ord":264},{"kind":"theme","id":"minimal","category":"style","label":"Minimal","ord":265},{"kind":"theme","id":"maximal","category":"style","label":"Maximal","ord":266},{"kind":"theme","id":"retro","category":"style","label":"Retro","ord":267},{"kind":"theme","id":"vintage","category":"style","label":"Vintage","ord":268},{"kind":"theme","id":"modern","category":"style","label":"Modern","ord":269},{"kind":"theme","id":"cyberpunk","category":"style","label":"Cyberpunk","ord":270},{"kind":"theme","id":"synthwave","category":"style","label":"Synthwave","ord":271},{"kind":"theme","id":"vaporwave","category":"style","label":"Vaporwave","ord":272},{"kind":"theme","id":"anime","category":"style","label":"Anime","ord":273},{"kind":"theme","id":"kawaii","category":"style","label":"Kawaii","ord":274},{"kind":"theme","id":"noir","category":"style","label":"Noir","ord":275},{"kind":"theme","id":"brutalist","category":"style","label":"Brutalist","ord":276},{"kind":"theme","id":"glass","category":"style","label":"Glass","ord":277},{"kind":"theme","id":"flat","category":"style","label":"Flat","ord":278},{"kind":"theme","id":"skeuomorph","category":"style","label":"Skeuomorph","ord":279},{"kind":"theme","id":"hand-drawn","category":"style","label":"Hand-drawn","ord":280},{"kind":"theme","id":"pixel","category":"style","label":"Pixel","ord":281},{"kind":"theme","id":"terminal","category":"style","label":"Terminal","ord":282},{"kind":"theme","id":"high-contrast","category":"style","label":"High contrast","ord":283},{"kind":"theme","id":"soft","category":"style","label":"Soft","ord":284},{"kind":"theme","id":"bold","category":"style","label":"Bold","ord":285},{"kind":"theme","id":"elegant","category":"style","label":"Elegant","ord":286},{"kind":"theme","id":"playful","category":"style","label":"Playful","ord":287},{"kind":"theme","id":"serious","category":"style","label":"Serious","ord":288},{"kind":"theme","id":"luxury","category":"style","label":"Luxury","ord":289},{"kind":"theme","id":"utilitarian","category":"style","label":"Utilitarian","ord":290},{"kind":"theme","id":"editorial","category":"style","label":"Editorial","ord":291},{"kind":"theme","id":"poster","category":"style","label":"Poster","ord":292},{"kind":"theme","id":"ui-chrome","category":"style","label":"UI chrome","ord":293},{"kind":"theme","id":"print","category":"style","label":"Print","ord":294},{"kind":"theme","id":"gradient","category":"style","label":"Gradient","ord":295},{"kind":"theme","id":"duotone","category":"style","label":"Duotone","ord":296},{"kind":"theme","id":"triadic","category":"style","label":"Triadic","ord":297},{"kind":"theme","id":"neon-grid","category":"style","label":"Neon grid","ord":298},{"kind":"theme","id":"crt","category":"style","label":"CRT","ord":299},{"kind":"theme","id":"vhs","category":"style","label":"VHS","ord":300},{"kind":"theme","id":"film","category":"style","label":"Film","ord":301},{"kind":"theme","id":"ink","category":"style","label":"Ink","ord":302},{"kind":"theme","id":"paper","category":"style","label":"Paper","ord":303},{"kind":"theme","id":"ocean","category":"setting","label":"Ocean","ord":304},{"kind":"theme","id":"forest","category":"setting","label":"Forest","ord":305},{"kind":"theme","id":"nature","category":"setting","label":"Nature","ord":306},{"kind":"theme","id":"space","category":"setting","label":"Space","ord":307},{"kind":"theme","id":"city","category":"setting","label":"City","ord":308},{"kind":"theme","id":"night-city","category":"setting","label":"Night city","ord":309},{"kind":"theme","id":"desert","category":"setting","label":"Desert","ord":310},{"kind":"theme","id":"mountain","category":"setting","label":"Mountain","ord":311},{"kind":"theme","id":"snow","category":"setting","label":"Snow","ord":312},{"kind":"theme","id":"rain","category":"setting","label":"Rain","ord":313},{"kind":"theme","id":"garden","category":"setting","label":"Garden","ord":314},{"kind":"theme","id":"cafe","category":"setting","label":"Cafe","ord":315},{"kind":"theme","id":"library","category":"setting","label":"Library","ord":316},{"kind":"theme","id":"studio","category":"setting","label":"Studio","ord":317},{"kind":"theme","id":"stage","category":"setting","label":"Stage","ord":318},{"kind":"theme","id":"arcade","category":"setting","label":"Arcade","ord":319},{"kind":"theme","id":"dungeon","category":"setting","label":"Dungeon","ord":320},{"kind":"theme","id":"castle","category":"setting","label":"Castle","ord":321},{"kind":"theme","id":"underwater","category":"setting","label":"Underwater","ord":322},{"kind":"theme","id":"sky","category":"setting","label":"Sky","ord":323},{"kind":"theme","id":"aurora","category":"setting","label":"Aurora","ord":324},{"kind":"theme","id":"volcano","category":"setting","label":"Volcano","ord":325},{"kind":"theme","id":"meadow","category":"setting","label":"Meadow","ord":326},{"kind":"theme","id":"harbor","category":"setting","label":"Harbor","ord":327},{"kind":"theme","id":"subway","category":"setting","label":"Subway","ord":328},{"kind":"theme","id":"rooftop","category":"setting","label":"Rooftop","ord":329},{"kind":"theme","id":"bedroom","category":"setting","label":"Bedroom","ord":330},{"kind":"theme","id":"office","category":"setting","label":"Office","ord":331},{"kind":"theme","id":"lab","category":"setting","label":"Lab","ord":332},{"kind":"theme","id":"temple","category":"setting","label":"Temple","ord":333},{"kind":"theme","id":"airy","category":"density","label":"Airy","ord":334},{"kind":"theme","id":"dense","category":"density","label":"Dense","ord":335},{"kind":"theme","id":"compact","category":"density","label":"Compact","ord":336},{"kind":"theme","id":"spacious","category":"density","label":"Spacious","ord":337},{"kind":"theme","id":"sharp","category":"density","label":"Sharp","ord":338},{"kind":"theme","id":"rounded","category":"density","label":"Rounded","ord":339},{"kind":"theme","id":"thin-type","category":"density","label":"Thin type","ord":340},{"kind":"theme","id":"heavy-type","category":"density","label":"Heavy type","ord":341},{"kind":"theme","id":"low-grid","category":"density","label":"Low grid","ord":342},{"kind":"theme","id":"strong-grid","category":"density","label":"Strong grid","ord":343},{"kind":"theme","id":"soft-shadow","category":"density","label":"Soft shadow","ord":344},{"kind":"theme","id":"hard-shadow","category":"density","label":"Hard shadow","ord":345},{"kind":"theme","id":"no-shadow","category":"density","label":"No shadow","ord":346},{"kind":"theme","id":"bordered","category":"density","label":"Bordered","ord":347},{"kind":"theme","id":"borderless","category":"density","label":"Borderless","ord":348},{"kind":"theme","id":"spring","category":"seasonal","label":"Spring","ord":349},{"kind":"theme","id":"summer","category":"seasonal","label":"Summer","ord":350},{"kind":"theme","id":"autumn","category":"seasonal","label":"Autumn","ord":351},{"kind":"theme","id":"winter","category":"seasonal","label":"Winter","ord":352},{"kind":"theme","id":"holiday","category":"seasonal","label":"Holiday","ord":353},{"kind":"theme","id":"christmas","category":"seasonal","label":"Christmas","ord":354},{"kind":"theme","id":"halloween","category":"seasonal","label":"Halloween","ord":355},{"kind":"theme","id":"new-year","category":"seasonal","label":"New year","ord":356},{"kind":"theme","id":"valentine","category":"seasonal","label":"Valentine","ord":357},{"kind":"theme","id":"pride","category":"seasonal","label":"Pride","ord":358},{"kind":"theme","id":"spooky","category":"seasonal","label":"Spooky","ord":359},{"kind":"theme","id":"festive","category":"seasonal","label":"Festive","ord":360},{"kind":"theme","id":"back-to-school","category":"seasonal","label":"Back to school","ord":361},{"kind":"theme","id":"solstice","category":"seasonal","label":"Solstice","ord":362},{"kind":"theme","id":"cozy","category":"mood","label":"Cozy","ord":363},{"kind":"theme","id":"calm","category":"mood","label":"Calm","ord":364},{"kind":"theme","id":"energetic","category":"mood","label":"Energetic","ord":365},{"kind":"theme","id":"dreamy","category":"mood","label":"Dreamy","ord":366},{"kind":"theme","id":"dramatic","category":"mood","label":"Dramatic","ord":367},{"kind":"theme","id":"romantic","category":"mood","label":"Romantic","ord":368},{"kind":"theme","id":"mysterious","category":"mood","label":"Mysterious","ord":369},{"kind":"theme","id":"cheerful","category":"mood","label":"Cheerful","ord":370},{"kind":"theme","id":"somber","category":"mood","label":"Somber","ord":371},{"kind":"theme","id":"focus","category":"mood","label":"Focus","ord":372},{"kind":"theme","id":"late-night","category":"mood","label":"Late night","ord":373},{"kind":"theme","id":"sunrise","category":"mood","label":"Sunrise","ord":374},{"kind":"theme","id":"golden-hour","category":"mood","label":"Golden hour","ord":375},{"kind":"theme","id":"storm","category":"mood","label":"Storm","ord":376},{"kind":"theme","id":"zen","category":"mood","label":"Zen","ord":377},{"kind":"theme","id":"hype","category":"mood","label":"Hype","ord":378},{"kind":"theme","id":"lo-fi","category":"mood","label":"Lo-fi","ord":379},{"kind":"theme","id":"clean","category":"mood","label":"Clean","ord":380},{"kind":"theme","id":"messy","category":"mood","label":"Messy","ord":381},{"kind":"theme","id":"cinematic","category":"mood","label":"Cinematic","ord":382}]$seed$::jsonb)
  as x(kind text, id text, category text, label text, ord int)
on conflict (kind, id) do update
  set category = excluded.category,
      label = excluded.label,
      sort_order = excluded.sort_order,
      active = true;

notify pgrst, 'reload schema';
