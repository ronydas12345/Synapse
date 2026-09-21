-- Privacy rights: consents, DSRs, self-service erasure (GDPR/CPRA/LGPD-aligned)

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users (id) on delete cascade,
  policy_id text not null check (policy_id in ('privacy', 'terms', 'cookies')),
  policy_version text not null check (char_length(policy_version) between 1 and 32),
  accepted boolean not null default true,
  source text not null default 'app' check (char_length(source) between 1 and 40),
  created_at timestamptz not null default now()
);

create index user_consents_uid_idx on public.user_consents (uid, created_at desc);

create table public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users (id) on delete cascade,
  request_type text not null check (
    request_type in ('access', 'export', 'rectify', 'erase', 'restrict', 'object', 'portability')
  ),
  status text not null default 'received' check (
    status in ('received', 'in_progress', 'completed', 'rejected')
  ),
  summary text not null default '' check (char_length(summary) <= 500),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index data_subject_requests_uid_idx on public.data_subject_requests (uid, created_at desc);

alter table public.user_consents enable row level security;
alter table public.data_subject_requests enable row level security;

create policy user_consents_select on public.user_consents
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

create policy user_consents_insert on public.user_consents
  for insert to authenticated
  with check (uid = auth.uid());

create policy data_subject_requests_select on public.data_subject_requests
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

create policy data_subject_requests_insert on public.data_subject_requests
  for insert to authenticated
  with check (uid = auth.uid() and request_type in ('access', 'export', 'erase', 'portability', 'rectify', 'restrict', 'object'));

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  insert into public.data_subject_requests (uid, request_type, status, summary, completed_at)
  values (uid, 'erase', 'completed', 'Account deleted by the user.', now());
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

alter publication supabase_realtime add table public.user_consents;
