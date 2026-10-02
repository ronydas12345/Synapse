-- PL/pgSQL variable `bio` collided with profiles.bio (same class of bug as
-- ambiguous uid). set_profile_public then threw, and the client snapped
-- visibility back to private.

create or replace function public.set_profile_public(p_visibility text, p_bio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  next_vis text := coalesce(p_visibility, 'private');
  next_bio text := coalesce(p_bio, '');
  updated int := 0;
begin
  if viewer is null then
    raise exception 'Not signed in';
  end if;
  if next_vis not in ('public', 'unlisted', 'private') then
    raise exception 'Invalid visibility';
  end if;
  if char_length(next_bio) > 500 then
    raise exception 'Bio is too long';
  end if;

  perform set_config('synapse.profile_rpc', '1', true);

  update public.profiles
    set visibility = next_vis,
        bio = next_bio
  where profiles.uid = viewer;
  get diagnostics updated = row_count;
  if updated = 0 then
    raise exception 'Finish creating your account first';
  end if;

  insert into public.creator_public (
    uid, username, display_name, photo_url, bio, equipped_decoration,
    featured_badge, visibility, share_id, follows_enabled, saves_enabled,
    follower_count, created_at
  )
  select
    profiles.uid, profiles.username, profiles.display_name, profiles.photo_url, profiles.bio,
    profiles.equipped_decoration, profiles.featured_badge, profiles.visibility, profiles.share_id,
    coalesce(profiles.follows_enabled, true), coalesce(profiles.saves_enabled, true),
    0, profiles.created_at
  from public.profiles
  where profiles.uid = viewer
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
end;
$$;

grant execute on function public.set_profile_public(text, text) to authenticated;
notify pgrst, 'reload schema';
