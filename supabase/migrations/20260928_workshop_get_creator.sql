-- Creator lookup by username or share ID, plus public badge reads.

create or replace function public.get_creator(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ref text := lower(trim(coalesce(p_id, '')));
  p public.creator_public;
begin
  if ref = '' then
    return null;
  end if;
  select * into p from public.creator_public
  where username = ref or share_id = ref;
  if not found then
    return null;
  end if;
  if p.visibility not in ('public', 'unlisted')
     and p.uid <> auth.uid()
     and not public.is_staff() then
    return null;
  end if;
  return to_jsonb(p);
end;
$$;

revoke execute on function public.get_creator(text) from public;
grant execute on function public.get_creator(text) to anon, authenticated;

grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

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

notify pgrst, 'reload schema';
