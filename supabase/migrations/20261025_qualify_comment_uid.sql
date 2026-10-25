-- add_workshop_comment(uuid, text) declared a PL/pgSQL variable named uid
-- and inserted into workshop_comments.uid, which Postgres reports as
-- "column reference uid is ambiguous". Rename the variable, keep a single
-- text overload (share id or uuid), and resolve comment usernames from
-- creator_public because the comments table has no username column.

create or replace function public.add_workshop_comment(p_id text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  r public.workshop_creations;
  body text := trim(coalesce(p_body, ''));
  recent int;
  new_id uuid;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if char_length(body) < 1 or char_length(body) > 400 then
    raise exception 'Comment must be 1–400 characters';
  end if;
  r := internal.resolve_creation(p_id);
  if r is null or r.status <> 'active' or r.visibility <> 'public' then
    raise exception 'Comments are only on public creations';
  end if;
  if not r.comments_enabled then
    raise exception 'Comments are turned off for this creation';
  end if;
  select count(*)::int into recent
  from public.workshop_comments c
  where c.uid = viewer and c.created_at > now() - interval '1 minute';
  if recent >= 8 then
    raise exception 'Too many comments. Wait a moment and try again.';
  end if;
  insert into public.workshop_comments (creation_id, uid, body)
  values (r.id, viewer, body)
  returning id into new_id;
  return new_id;
end;
$$;

drop function if exists public.add_workshop_comment(uuid, text);

revoke execute on function public.add_workshop_comment(text, text) from public, anon;
grant execute on function public.add_workshop_comment(text, text) to authenticated;

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
      'username', coalesce(p.username, ''),
      'body', c.body,
      'createdAt', c.created_at
    ) order by c.created_at)
    from public.workshop_comments c
    left join public.creator_public p on p.uid = c.uid
    where c.creation_id = r.id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.list_workshop_comments(text) from public;
grant execute on function public.list_workshop_comments(text) to anon, authenticated;

notify pgrst, 'reload schema';
