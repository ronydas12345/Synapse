-- Server-authoritative tokens, sessions, flags, and Playground games.
-- Clients never write balances or ledger rows.
-- Play badges reuse workshop `badge_defs` / `internal.award_badge` when present.

create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

create table if not exists public.badge_defs (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null check (char_length(name) between 1 and 40),
  description text not null check (char_length(description) between 1 and 200),
  category text not null,
  sort_order int not null default 0
);

create table if not exists public.user_badges (
  uid uuid not null references auth.users (id) on delete cascade,
  badge_id text not null references public.badge_defs (id),
  awarded_at timestamptz not null default now(),
  primary key (uid, badge_id)
);

create or replace function internal.award_badge(p_uid uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_badges (uid, badge_id)
  values (p_uid, p_badge)
  on conflict do nothing;
end;
$$;

alter table public.badge_defs drop constraint if exists badge_defs_category_check;
alter table public.badge_defs
  add constraint badge_defs_category_check
  check (category in ('account', 'creator', 'community', 'staff', 'play'));

insert into public.badge_defs (id, name, description, category, sort_order) values
  ('first_game', 'First Game', 'Finished a Playground game.', 'play', 110),
  ('tokens_100', 'First 100 Tokens', 'Earned 100 tokens over the lifetime of the account.', 'play', 120),
  ('tokens_1000', 'First 1,000 Tokens', 'Earned 1,000 tokens over the lifetime of the account.', 'play', 130),
  ('game_explorer', 'Game Explorer', 'Completed five different Playground games.', 'play', 140),
  ('perfect_score', 'Perfect Score', 'Scored 100 on a Playground game.', 'play', 150)
on conflict (id) do nothing;

create table public.gamification_flags (
  id text primary key check (id ~ '^[a-zA-Z][a-zA-Z0-9_]+$'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.gamification_flags (id, enabled) values
  ('gamificationEnabled', true),
  ('playgroundEnabled', true),
  ('eventsEnabled', false),
  ('badgesEnabled', true),
  ('decorationsEnabled', true),
  ('dailyRewardsEnabled', true),
  ('weeklyChallengesEnabled', false),
  ('gameLabEnabled', true)
on conflict (id) do nothing;

create table public.gamification_config (
  id text primary key default 'default' check (id = 'default'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.gamification_config (id, payload) values (
  'default',
  jsonb_build_object(
    'tokenLabel', 'Tokens',
    'dailyGameTokenCap', 200,
    'weeklyGameTokenCap', 800,
    'maxSessionsPerMinute', 6,
    'dailyRewardSchedule', jsonb_build_array(10, 15, 20, 25, 30, 35, 50)
  )
)
on conflict (id) do nothing;

create table public.gamification_games (
  id text primary key check (id ~ '^[a-z][a-z0-9_]+$'),
  name text not null check (char_length(name) between 1 and 40),
  description text not null check (char_length(description) between 1 and 200),
  category text not null,
  release_state text not null default 'public'
    check (release_state in ('draft', 'internal', 'superadmin', 'staged', 'public', 'disabled', 'archived')),
  enabled boolean not null default true,
  featured boolean not null default false,
  maintenance boolean not null default false,
  estimated_seconds int not null default 30 check (estimated_seconds between 5 and 300),
  min_duration_ms int not null default 800 check (min_duration_ms between 200 and 120000),
  reward_bands jsonb not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.gamification_games (
  id, name, description, category, featured, estimated_seconds, min_duration_ms, reward_bands, sort_order
) values
  ('pulse', 'Pulse', 'Wait for the flash, then tap as quickly as you can.', 'reaction', true, 20, 700, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 10),
  ('echo', 'Echo', 'Watch the tiles light up, then repeat the pattern.', 'memory', false, 40, 4000, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 20),
  ('downbeat', 'Downbeat', 'Tap along with eight steady beats.', 'rhythm', false, 25, 4000, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 30),
  ('nextnote', 'Next Note', 'Find the next number in a short sequence.', 'pattern', false, 25, 2000, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 40),
  ('hold', 'Hold', 'Stop the marker on the target band.', 'timing', false, 20, 1500, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 50),
  ('oddpath', 'Odd Path', 'Pick the tile that does not belong.', 'logic', false, 25, 1500, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 60),
  ('match', 'Match', 'Find the pair that looks the same.', 'visual', false, 25, 1500, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 70),
  ('pitchpick', 'Pitch Pick', 'Play two tones and choose the higher one.', 'audio', false, 25, 1500, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 80),
  ('follow', 'Follow', 'Repeat a growing digit sequence.', 'sequence', false, 35, 3000, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 90),
  ('pinpoint', 'Pinpoint', 'Tap the shrinking target before it disappears.', 'precision', false, 20, 1200, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 100),
  ('swift', 'Swift', 'Mark left or right as quickly as you can.', 'speed', false, 25, 18000, '[{"min":0,"max":49,"tokens":10},{"min":50,"max":79,"tokens":20},{"min":80,"max":94,"tokens":30},{"min":95,"max":100,"tokens":40}]'::jsonb, 110)
on conflict (id) do nothing;

create table public.gamification_wallets (
  uid uuid primary key references auth.users (id) on delete cascade,
  token_balance int not null default 0 check (token_balance >= 0),
  lifetime_earned int not null default 0 check (lifetime_earned >= 0),
  lifetime_spent int not null default 0 check (lifetime_spent >= 0),
  daily_game_tokens int not null default 0 check (daily_game_tokens >= 0),
  weekly_game_tokens int not null default 0 check (weekly_game_tokens >= 0),
  daily_on date not null default ((timezone('utc', now()))::date),
  weekly_on date not null default date_trunc('week', timezone('utc', now()))::date,
  current_streak int not null default 0 check (current_streak >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  last_daily_claim date,
  updated_at timestamptz not null default now()
);

create table public.gamification_ledger (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in (
    'game_reward', 'daily_reward', 'weekly_reward', 'event_reward',
    'achievement_reward', 'challenge_reward', 'cosmetic_purchase',
    'admin_adjustment', 'refund', 'expiration'
  )),
  amount int not null,
  balance_before int not null,
  balance_after int not null,
  source text not null default '',
  source_id text not null default '',
  description text not null check (char_length(description) between 1 and 200),
  status text not null default 'completed' check (status = 'completed'),
  created_at timestamptz not null default now()
);

create unique index gamification_ledger_idempotent
  on public.gamification_ledger (uid, source, source_id)
  where source_id <> '';

create index gamification_ledger_uid_idx
  on public.gamification_ledger (uid, created_at desc);

create table public.gamification_sessions (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.gamification_games (id),
  practice boolean not null default false,
  status text not null default 'started' check (status in ('started', 'completed', 'invalid')),
  score int,
  reward_tokens int not null default 0,
  deny_reason text not null default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index gamification_sessions_uid_idx
  on public.gamification_sessions (uid, started_at desc);

create table public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  start_at timestamptz not null,
  end_at timestamptz not null,
  enabled boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.gamification_analytics (
  id uuid primary key default gen_random_uuid(),
  uid uuid,
  event_name text not null check (char_length(event_name) between 1 and 60),
  game_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index gamification_analytics_created_idx
  on public.gamification_analytics (created_at desc);

create table public.gamification_signals (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null,
  kind text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.flag_on(p_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select enabled from public.gamification_flags where id = p_id), false);
$$;

revoke execute on function public.flag_on(text) from public, anon;
grant execute on function public.flag_on(text) to authenticated;

create or replace function internal.gamification_cfg()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select payload from public.gamification_config where id = 'default';
$$;

create or replace function internal.ensure_wallet(p_uid uuid)
returns public.gamification_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.gamification_wallets;
  today date := (timezone('utc', now()))::date;
  week_start date := date_trunc('week', timezone('utc', now()))::date;
begin
  insert into public.gamification_wallets (uid)
  values (p_uid)
  on conflict (uid) do nothing;

  select * into w from public.gamification_wallets where uid = p_uid for update;

  if w.daily_on <> today then
    w.daily_game_tokens := 0;
    w.daily_on := today;
  end if;
  if w.weekly_on <> week_start then
    w.weekly_game_tokens := 0;
    w.weekly_on := week_start;
  end if;

  update public.gamification_wallets
    set daily_game_tokens = w.daily_game_tokens,
        weekly_game_tokens = w.weekly_game_tokens,
        daily_on = w.daily_on,
        weekly_on = w.weekly_on,
        updated_at = now()
    where uid = p_uid;

  select * into w from public.gamification_wallets where uid = p_uid;
  return w;
end;
$$;

create or replace function internal.record_analytics(
  p_uid uuid,
  p_event text,
  p_game text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gamification_analytics (uid, event_name, game_id, payload)
  values (p_uid, p_event, p_game, coalesce(p_payload, '{}'::jsonb));
end;
$$;

create or replace function internal.credit_tokens(
  p_uid uuid,
  p_amount int,
  p_type text,
  p_source text,
  p_source_id text,
  p_description text
)
returns public.gamification_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.gamification_wallets;
  next_balance int;
begin
  w := internal.ensure_wallet(p_uid);
  if p_amount = 0 then
    return w;
  end if;
  next_balance := w.token_balance + p_amount;
  if next_balance < 0 then
    raise exception 'Token balance cannot go below zero';
  end if;

  insert into public.gamification_ledger (
    uid, type, amount, balance_before, balance_after, source, source_id, description
  ) values (
    p_uid, p_type, p_amount, w.token_balance, next_balance, coalesce(p_source, ''),
    coalesce(p_source_id, ''), p_description
  );

  update public.gamification_wallets
    set token_balance = next_balance,
        lifetime_earned = lifetime_earned + greatest(p_amount, 0),
        lifetime_spent = lifetime_spent + greatest(-p_amount, 0),
        updated_at = now()
    where uid = p_uid
    returning * into w;
  return w;
end;
$$;

create or replace function internal.tokens_for_score(p_bands jsonb, p_score int)
returns int
language plpgsql
stable
as $$
declare
  band jsonb;
  tokens int := 0;
begin
  for band in select value from jsonb_array_elements(coalesce(p_bands, '[]'::jsonb))
  loop
    if p_score >= coalesce((band->>'min')::int, 0)
      and p_score <= coalesce((band->>'max')::int, 100) then
      tokens := greatest(coalesce((band->>'tokens')::int, 0), 0);
    end if;
  end loop;
  return tokens;
end;
$$;

create or replace function internal.evaluate_play_badges(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.gamification_wallets;
  games_played int;
begin
  w := internal.ensure_wallet(p_uid);
  if exists (
    select 1 from public.gamification_sessions s
    where s.uid = p_uid and s.status = 'completed'
  ) then
    perform internal.award_badge(p_uid, 'first_game');
  end if;
  if w.lifetime_earned >= 100 then
    perform internal.award_badge(p_uid, 'tokens_100');
  end if;
  if w.lifetime_earned >= 1000 then
    perform internal.award_badge(p_uid, 'tokens_1000');
  end if;
  select count(distinct game_id)::int into games_played
  from public.gamification_sessions
  where uid = p_uid and status = 'completed';
  if games_played >= 5 then
    perform internal.award_badge(p_uid, 'game_explorer');
  end if;
  if exists (
    select 1 from public.gamification_sessions
    where uid = p_uid and status = 'completed' and score = 100
  ) then
    perform internal.award_badge(p_uid, 'perfect_score');
  end if;
end;
$$;

create or replace function public.start_game_session(p_game_id text, p_practice boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g public.gamification_games;
  cfg jsonb;
  recent int;
  new_id uuid;
  practice boolean := coalesce(p_practice, false);
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if not public.flag_on('gamificationEnabled') or not public.flag_on('playgroundEnabled') then
    if not public.is_superadmin() then
      raise exception 'Playground is not available';
    end if;
  end if;

  select * into g from public.gamification_games where id = p_game_id;
  if not found then
    raise exception 'Game not found';
  end if;
  if g.maintenance then
    raise exception 'This game is under maintenance';
  end if;
  if not public.is_superadmin() then
    if not g.enabled or g.release_state <> 'public' then
      raise exception 'This game is not available';
    end if;
  end if;

  cfg := internal.gamification_cfg();
  select count(*)::int into recent
  from public.gamification_sessions
  where gamification_sessions.uid = start_game_session.uid
    and started_at > now() - interval '1 minute';
  if recent >= coalesce((cfg->>'maxSessionsPerMinute')::int, 6) then
    insert into public.gamification_signals (uid, kind, detail)
    values (uid, 'rate_limit', p_game_id);
    raise exception 'Too many game starts. Wait a moment and try again.';
  end if;

  insert into public.gamification_sessions (uid, game_id, practice)
  values (uid, p_game_id, practice)
  returning id into new_id;

  perform internal.record_analytics(
    uid,
    'game_started',
    p_game_id,
    jsonb_build_object('practice', practice, 'sessionId', new_id)
  );

  return jsonb_build_object(
    'sessionId', new_id,
    'gameId', p_game_id,
    'practice', practice,
    'startedAt', now()
  );
end;
$$;

create or replace function public.submit_game_result(p_session_id uuid, p_score int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  s public.gamification_sessions;
  g public.gamification_games;
  w public.gamification_wallets;
  cfg jsonb;
  duration_ms int;
  score int := least(greatest(coalesce(p_score, 0), 0), 100);
  reward int := 0;
  remaining int;
  reason text := '';
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select * into s from public.gamification_sessions where id = p_session_id for update;
  if not found or s.uid <> uid then
    raise exception 'Session not found';
  end if;
  if s.status <> 'started' then
    return jsonb_build_object(
      'sessionId', s.id,
      'status', s.status,
      'score', s.score,
      'rewardTokens', s.reward_tokens,
      'denyReason', s.deny_reason,
      'alreadySubmitted', true
    );
  end if;

  select * into g from public.gamification_games where id = s.game_id;
  duration_ms := greatest(extract(epoch from (now() - s.started_at)) * 1000, 0)::int;

  if duration_ms < g.min_duration_ms then
    insert into public.gamification_signals (uid, kind, detail)
    values (uid, 'impossible_time', s.game_id || ':' || duration_ms::text);
    update public.gamification_sessions
      set status = 'invalid',
          score = score,
          deny_reason = 'invalid',
          ended_at = now()
      where id = s.id;
    perform internal.record_analytics(uid, 'game_session_invalidated', s.game_id, jsonb_build_object('sessionId', s.id));
    return jsonb_build_object(
      'sessionId', s.id,
      'status', 'invalid',
      'score', score,
      'rewardTokens', 0,
      'denyReason', 'invalid',
      'message', 'Your game result could not be verified, so no reward was issued.'
    );
  end if;

  if s.practice then
    reason := 'practice';
    reward := 0;
  else
    cfg := internal.gamification_cfg();
    w := internal.ensure_wallet(uid);
    reward := internal.tokens_for_score(g.reward_bands, score);
    remaining := least(
      greatest(coalesce((cfg->>'dailyGameTokenCap')::int, 200) - w.daily_game_tokens, 0),
      greatest(coalesce((cfg->>'weeklyGameTokenCap')::int, 800) - w.weekly_game_tokens, 0)
    );
    if remaining <= 0 then
      reward := 0;
      reason := 'cap';
    elsif reward > remaining then
      reward := remaining;
      reason := 'cap_partial';
    end if;
  end if;

  update public.gamification_sessions
    set status = 'completed',
        score = score,
        reward_tokens = reward,
        deny_reason = reason,
        ended_at = now()
    where id = s.id;

  if reward > 0 then
    w := internal.credit_tokens(
      uid, reward, 'game_reward', 'game_session', s.id::text, 'Reward for completing ' || g.name
    );
    update public.gamification_wallets
      set daily_game_tokens = daily_game_tokens + reward,
          weekly_game_tokens = weekly_game_tokens + reward,
          updated_at = now()
      where gamification_wallets.uid = submit_game_result.uid;
    perform internal.record_analytics(
      uid, 'game_rewarded', s.game_id,
      jsonb_build_object('sessionId', s.id, 'score', score, 'tokens', reward)
    );
    perform internal.record_analytics(uid, 'token_earned', s.game_id, jsonb_build_object('amount', reward, 'source', 'game_reward'));
  elsif s.practice then
    perform internal.record_analytics(uid, 'game_completed', s.game_id, jsonb_build_object('sessionId', s.id, 'practice', true, 'score', score));
  else
    perform internal.record_analytics(uid, 'game_reward_denied', s.game_id, jsonb_build_object('sessionId', s.id, 'reason', reason, 'score', score));
  end if;

  perform internal.evaluate_play_badges(uid);
  w := internal.ensure_wallet(uid);

  return jsonb_build_object(
    'sessionId', s.id,
    'status', 'completed',
    'score', score,
    'rewardTokens', reward,
    'denyReason', reason,
    'tokenBalance', w.token_balance,
    'dailyGameTokens', w.daily_game_tokens,
    'weeklyGameTokens', w.weekly_game_tokens,
    'alreadySubmitted', false
  );
end;
$$;

create or replace function public.claim_daily_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  w public.gamification_wallets;
  cfg jsonb;
  today date := (timezone('utc', now()))::date;
  schedule jsonb;
  idx int;
  amount int;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if not public.flag_on('dailyRewardsEnabled') then
    raise exception 'Daily rewards are not available';
  end if;
  w := internal.ensure_wallet(uid);
  if w.last_daily_claim = today then
    raise exception 'Daily reward already claimed';
  end if;
  cfg := internal.gamification_cfg();
  schedule := coalesce(cfg->'dailyRewardSchedule', '[10]'::jsonb);
  if w.last_daily_claim = today - 1 then
    w.current_streak := w.current_streak + 1;
  else
    w.current_streak := 1;
  end if;
  if w.current_streak > w.longest_streak then
    w.longest_streak := w.current_streak;
  end if;
  idx := least(w.current_streak, jsonb_array_length(schedule)) - 1;
  amount := greatest(coalesce((schedule->>idx)::int, 10), 0);

  update public.gamification_wallets
    set current_streak = w.current_streak,
        longest_streak = w.longest_streak,
        last_daily_claim = today,
        updated_at = now()
    where gamification_wallets.uid = claim_daily_reward.uid;

  w := internal.credit_tokens(
    uid, amount, 'daily_reward', 'daily', today::text, 'Daily reward'
  );
  perform internal.record_analytics(uid, 'daily_reward_claimed', null, jsonb_build_object('amount', amount, 'streak', w.current_streak));
  perform internal.evaluate_play_badges(uid);

  return jsonb_build_object(
    'amount', amount,
    'streak', (select current_streak from public.gamification_wallets where gamification_wallets.uid = uid),
    'tokenBalance', w.token_balance,
    'claimedOn', today
  );
end;
$$;

create or replace function public.get_gamification_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  w public.gamification_wallets;
  cfg jsonb;
  flags jsonb;
  games jsonb;
  recent jsonb;
  today date := (timezone('utc', now()))::date;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  w := internal.ensure_wallet(uid);
  cfg := internal.gamification_cfg();
  select coalesce(jsonb_object_agg(id, enabled), '{}'::jsonb) into flags
  from public.gamification_flags;
  select coalesce(jsonb_agg(to_jsonb(g) order by g.sort_order), '[]'::jsonb) into games
  from public.gamification_games g
  where public.is_superadmin()
     or (g.enabled and g.release_state = 'public');
  select coalesce(jsonb_agg(to_jsonb(s) order by s.started_at desc), '[]'::jsonb) into recent
  from (
    select id, game_id, practice, status, score, reward_tokens, deny_reason, started_at, ended_at
    from public.gamification_sessions
    where gamification_sessions.uid = uid
    order by started_at desc
    limit 12
  ) s;

  return jsonb_build_object(
    'wallet', to_jsonb(w),
    'config', cfg,
    'flags', flags,
    'games', games,
    'recent', recent,
    'dailyClaimed', w.last_daily_claim = today,
    'isSuperadmin', public.is_superadmin()
  );
end;
$$;

create or replace function public.staff_set_gamification_flag(p_id text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  update public.gamification_flags
    set enabled = coalesce(p_enabled, false), updated_at = now()
    where id = p_id;
  if not found then
    raise exception 'Unknown flag';
  end if;
  insert into public.admin_audit (actor_uid, actor_email, action, target_type, target_id, summary)
  values (
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    'gamification.flag',
    'flag',
    p_id,
    'Set ' || p_id || ' to ' || coalesce(p_enabled, false)::text
  );
end;
$$;

create or replace function public.staff_update_game(
  p_id text,
  p_enabled boolean,
  p_featured boolean,
  p_maintenance boolean,
  p_release_state text,
  p_reward_bands jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  if p_release_state is not null and p_release_state not in (
    'draft', 'internal', 'superadmin', 'staged', 'public', 'disabled', 'archived'
  ) then
    raise exception 'Invalid release state';
  end if;
  update public.gamification_games
    set enabled = coalesce(p_enabled, enabled),
        featured = coalesce(p_featured, featured),
        maintenance = coalesce(p_maintenance, maintenance),
        release_state = coalesce(p_release_state, release_state),
        reward_bands = coalesce(p_reward_bands, reward_bands),
        updated_at = now()
    where id = p_id;
  if not found then
    raise exception 'Game not found';
  end if;
  insert into public.admin_audit (actor_uid, actor_email, action, target_type, target_id, summary)
  values (
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    'gamification.game',
    'game',
    p_id,
    'Updated game ' || p_id
  );
end;
$$;

create or replace function public.staff_adjust_tokens(p_uid uuid, p_amount int, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reason text := trim(coalesce(p_reason, ''));
begin
  if not public.is_superadmin() then
    raise exception 'Superadmin only';
  end if;
  if p_amount = 0 then
    raise exception 'Amount cannot be zero';
  end if;
  if char_length(reason) < 3 then
    raise exception 'A reason is required';
  end if;
  perform internal.credit_tokens(
    p_uid,
    p_amount,
    'admin_adjustment',
    'admin',
    gen_random_uuid()::text,
    left('Adjustment: ' || reason, 200)
  );
  insert into public.admin_audit (actor_uid, actor_email, action, target_type, target_id, summary)
  values (
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    'gamification.adjust',
    'user',
    p_uid::text,
    left('Token adjustment ' || p_amount::text || ': ' || reason, 300)
  );
end;
$$;

create or replace function public.staff_gamification_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Staff only';
  end if;
  return jsonb_build_object(
    'playgroundUsers', (select count(*) from public.gamification_wallets),
    'gamesToday', (
      select count(*) from public.gamification_sessions
      where started_at >= date_trunc('day', timezone('utc', now()))
    ),
    'gamesWeek', (
      select count(*) from public.gamification_sessions
      where started_at >= date_trunc('week', timezone('utc', now()))
    ),
    'tokensEarned', (select coalesce(sum(lifetime_earned), 0) from public.gamification_wallets),
    'tokensSpent', (select coalesce(sum(lifetime_spent), 0) from public.gamification_wallets),
    'rewardedSessions', (
      select count(*) from public.gamification_sessions where reward_tokens > 0
    ),
    'practiceSessions', (
      select count(*) from public.gamification_sessions where practice
    )
  );
end;
$$;

alter table public.gamification_flags enable row level security;
alter table public.gamification_config enable row level security;
alter table public.gamification_games enable row level security;
alter table public.gamification_wallets enable row level security;
alter table public.gamification_ledger enable row level security;
alter table public.gamification_sessions enable row level security;
alter table public.gamification_events enable row level security;
alter table public.gamification_analytics enable row level security;
alter table public.gamification_signals enable row level security;
alter table public.badge_defs enable row level security;
alter table public.user_badges enable row level security;

create policy flags_read on public.gamification_flags
  for select to authenticated using (true);
create policy config_read on public.gamification_config
  for select to authenticated using (true);
create policy games_read on public.gamification_games
  for select to authenticated
  using (public.is_superadmin() or (enabled and release_state = 'public'));
create policy wallets_own on public.gamification_wallets
  for select to authenticated using (uid = auth.uid() or public.is_staff());
create policy ledger_own on public.gamification_ledger
  for select to authenticated using (uid = auth.uid() or public.is_superadmin());
create policy sessions_own on public.gamification_sessions
  for select to authenticated using (uid = auth.uid() or public.is_staff());
create policy events_read on public.gamification_events
  for select to authenticated
  using (enabled or public.is_superadmin());
create policy analytics_staff on public.gamification_analytics
  for select to authenticated using (public.is_staff());
create policy signals_staff on public.gamification_signals
  for select to authenticated using (public.is_superadmin());
create policy badge_defs_read on public.badge_defs
  for select to anon, authenticated using (true);
create policy user_badges_read on public.user_badges
  for select to authenticated using (uid = auth.uid() or public.is_staff());

grant select on public.gamification_flags to authenticated;
grant select on public.gamification_config to authenticated;
grant select on public.gamification_games to authenticated;
grant select on public.gamification_wallets to authenticated;
grant select on public.gamification_ledger to authenticated;
grant select on public.gamification_sessions to authenticated;
grant select on public.gamification_events to authenticated;
grant select on public.gamification_analytics to authenticated;
grant select on public.gamification_signals to authenticated;
grant select on public.badge_defs to anon, authenticated;
grant select on public.user_badges to authenticated;

revoke execute on function public.start_game_session(text, boolean) from public, anon;
grant execute on function public.start_game_session(text, boolean) to authenticated;
revoke execute on function public.submit_game_result(uuid, int) from public, anon;
grant execute on function public.submit_game_result(uuid, int) to authenticated;
revoke execute on function public.claim_daily_reward() from public, anon;
grant execute on function public.claim_daily_reward() to authenticated;
revoke execute on function public.get_gamification_state() from public, anon;
grant execute on function public.get_gamification_state() to authenticated;
revoke execute on function public.staff_set_gamification_flag(text, boolean) from public, anon;
grant execute on function public.staff_set_gamification_flag(text, boolean) to authenticated;
revoke execute on function public.staff_update_game(text, boolean, boolean, boolean, text, jsonb) from public, anon;
grant execute on function public.staff_update_game(text, boolean, boolean, boolean, text, jsonb) to authenticated;
revoke execute on function public.staff_adjust_tokens(uuid, int, text) from public, anon;
grant execute on function public.staff_adjust_tokens(uuid, int, text) to authenticated;
revoke execute on function public.staff_gamification_stats() from public, anon;
grant execute on function public.staff_gamification_stats() to authenticated;
