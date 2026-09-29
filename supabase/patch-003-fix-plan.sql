-- Attntion: persona-test fix plan. Run once in the Supabase SQL editor. Safe to re-run.
-- Everything here is optional for the app to run: until it is applied, the
-- app keeps working and simply skips what needs these tables/columns.

-- Product events (question shown, draft shown, posted, returned, email clicks)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  props jsonb default '{}',
  created_at timestamp with time zone default now()
);
create index if not exists events_name_time on public.events (name, created_at);
create index if not exists events_user_time on public.events (user_id, created_at);
alter table public.events enable row level security;
drop policy if exists "Users log own events" on public.events;
create policy "Users log own events" on public.events for insert with check (auth.uid() = user_id);
drop policy if exists "Users read own events" on public.events;
create policy "Users read own events" on public.events for select using (auth.uid() = user_id);

-- Durable rate limiting for the public demo (service role only: no policies)
create table if not exists public.demo_hits (
  id bigserial primary key,
  ip text not null,
  created_at timestamp with time zone default now()
);
create index if not exists demo_hits_ip_time on public.demo_hits (ip, created_at);
create index if not exists demo_hits_time on public.demo_hits (created_at);
alter table public.demo_hits enable row level security;

-- Where each weekly niche study came from, and how many real posts it read
alter table public.niche_intelligence
  add column if not exists data_source text,
  add column if not exists post_count integer default 0;

-- Session extras: question swaps, the published post's link, reminder sent
alter table public.weekly_sessions
  add column if not exists question_swaps integer default 0,
  add column if not exists post_url text,
  add column if not exists reminded_at timestamp with time zone;
