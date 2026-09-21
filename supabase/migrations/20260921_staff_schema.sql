-- Staff schema + RLS for Synapse (profiles, roles, tickets, moderation, audit, themes)

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = 'dasrony231@gmail.com'
      and u.email_confirmed_at is not null
  );
$$;

create table public.profiles (
  uid uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  photo_url text not null default '' check (
    char_length(photo_url) <= 2048
    and (photo_url = '' or photo_url like 'https://%')
  ),
  status text not null default 'active' check (status in ('active', 'suspended')),
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index profiles_username_key on public.profiles (username);
create index profiles_email_idx on public.profiles (email);

create table public.roles (
  uid uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role = 'admin'),
  email text not null,
  active boolean not null default true,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.roles r
    where r.uid = auth.uid()
      and r.role = 'admin'
      and r.active = true
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin() or public.is_admin();
$$;

grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users (id) on delete cascade,
  email text not null,
  subject text not null check (char_length(subject) between 3 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_admin_uid uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_uid_idx on public.tickets (uid);
create index tickets_created_at_idx on public.tickets (created_at desc);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

create table public.moderation (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('avatar', 'overlay')),
  target_uid uuid not null,
  image_url text not null default '' check (
    char_length(image_url) <= 2048
    and (image_url = '' or image_url like 'https://%')
  ),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed')),
  note text not null default '' check (char_length(note) <= 500),
  reviewer_uid uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_uid uuid not null,
  actor_email text not null,
  action text not null check (char_length(action) between 1 and 80),
  target_type text not null check (char_length(target_type) between 1 and 40),
  target_id text not null default '' check (char_length(target_id) <= 128),
  summary text not null check (char_length(summary) between 1 and 300),
  created_at timestamptz not null default now()
);

create index admin_audit_created_at_idx on public.admin_audit (created_at desc);

create table public.published_themes (
  theme_id text primary key check (theme_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  name text not null check (char_length(name) between 1 and 64),
  status text not null check (status in ('published', 'archived')),
  published_by uuid not null,
  payload_json text not null check (char_length(payload_json) between 2 and 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.uid := old.uid;
  new.email := old.email;
  new.created_at := old.created_at;
  if not public.is_staff() then
    new.status := old.status;
  elsif public.is_admin() and not public.is_superadmin() then
    if lower(old.email) = 'dasrony231@gmail.com'
      or exists (select 1 from public.roles r where r.uid = old.uid) then
      new.status := old.status;
    end if;
  elsif lower(old.email) = 'dasrony231@gmail.com' then
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_enforce_update
before update on public.profiles
for each row execute function public.enforce_profile_update();

create or replace function public.enforce_role_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.uid := old.uid;
  new.role := 'admin';
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger roles_enforce_update
before update on public.roles
for each row execute function public.enforce_role_update();

create or replace function public.enforce_ticket_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.id := old.id;
  new.uid := old.uid;
  new.email := old.email;
  new.subject := old.subject;
  new.body := old.body;
  new.created_at := old.created_at;
  if not public.is_superadmin() then
    new.assigned_admin_uid := old.assigned_admin_uid;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger tickets_enforce_update
before update on public.tickets
for each row execute function public.enforce_ticket_update();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.moderation enable row level security;
alter table public.admin_audit enable row level security;
alter table public.published_themes enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (
    (
      uid = auth.uid()
      and status = 'active'
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    or public.is_superadmin()
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (uid = auth.uid() or public.is_staff())
  with check (uid = auth.uid() or public.is_staff());

create policy roles_select on public.roles
  for select to authenticated
  using (uid = auth.uid() or public.is_superadmin());

create policy roles_write on public.roles
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin() and role = 'admin');

create policy tickets_select on public.tickets
  for select to authenticated
  using (uid = auth.uid() or public.is_staff());

create policy tickets_insert on public.tickets
  for insert to authenticated
  with check (
    uid = auth.uid()
    and status = 'open'
    and assigned_admin_uid is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy tickets_update on public.tickets
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy ticket_messages_select on public.ticket_messages
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.uid = auth.uid()
    )
  );

create policy ticket_messages_insert on public.ticket_messages
  for insert to authenticated
  with check (
    uid = auth.uid()
    and (
      public.is_staff()
      or exists (
        select 1 from public.tickets t
        where t.id = ticket_id and t.uid = auth.uid()
      )
    )
  );

create policy moderation_staff on public.moderation
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy admin_audit_read on public.admin_audit
  for select to authenticated
  using (public.is_superadmin());

create policy admin_audit_insert on public.admin_audit
  for insert to authenticated
  with check (public.is_staff() and actor_uid = auth.uid());

create policy published_themes_select on public.published_themes
  for select to authenticated
  using (true);

create policy published_themes_write on public.published_themes
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.roles;

revoke execute on function public.enforce_profile_update() from public, anon, authenticated;
revoke execute on function public.enforce_role_update() from public, anon, authenticated;
revoke execute on function public.enforce_ticket_update() from public, anon, authenticated;

revoke execute on function public.is_superadmin() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;

grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;


revoke execute on function public.enforce_profile_update() from public, anon, authenticated;
revoke execute on function public.enforce_role_update() from public, anon, authenticated;
revoke execute on function public.enforce_ticket_update() from public, anon, authenticated;

revoke execute on function public.is_superadmin() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;

grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

