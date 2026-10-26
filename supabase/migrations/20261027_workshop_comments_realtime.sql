-- Stream Workshop comment inserts and deletes to open creation pages.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'workshop_comments'
  ) then
    alter publication supabase_realtime add table public.workshop_comments;
  end if;
end $$;
