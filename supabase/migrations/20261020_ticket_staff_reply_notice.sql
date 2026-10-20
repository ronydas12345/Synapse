-- Track unseen staff replies so the ticket owner can see a Settings notice.

alter table public.tickets
  add column if not exists last_staff_reply_at timestamptz,
  add column if not exists staff_reply_seen_at timestamptz;

create or replace function public.note_staff_ticket_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select t.uid into owner
  from public.tickets t
  where t.id = new.ticket_id;
  if owner is null or owner = new.uid then
    return new;
  end if;
  update public.tickets
    set last_staff_reply_at = coalesce(new.created_at, now()),
        updated_at = now()
    where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists ticket_messages_note_staff_reply on public.ticket_messages;
create trigger ticket_messages_note_staff_reply
after insert on public.ticket_messages
for each row execute function public.note_staff_ticket_reply();

create or replace function public.mark_ticket_staff_reply_seen(p_id uuid default null)
returns void
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
  update public.tickets
    set staff_reply_seen_at = now()
    where uid = viewer
      and last_staff_reply_at is not null
      and (p_id is null or id = p_id)
      and (staff_reply_seen_at is null or staff_reply_seen_at < last_staff_reply_at);
end;
$$;

revoke execute on function public.note_staff_ticket_reply() from public, anon, authenticated;
revoke execute on function public.mark_ticket_staff_reply_seen(uuid) from public, anon;
grant execute on function public.mark_ticket_staff_reply_seen(uuid) to authenticated;

-- Existing threads are already "seen" so only new staff replies light the notice.
update public.tickets t
set last_staff_reply_at = s.latest,
    staff_reply_seen_at = s.latest
from (
  select m.ticket_id, max(m.created_at) as latest
  from public.ticket_messages m
  join public.tickets owner on owner.id = m.ticket_id
  where m.uid <> owner.uid
  group by m.ticket_id
) s
where t.id = s.ticket_id
  and t.last_staff_reply_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;
end $$;

notify pgrst, 'reload schema';
