-- ============================================================
-- Attntion database schema
--
-- HOW TO RUN THIS:
-- 1. Go to your Supabase project dashboard
-- 2. Open the SQL Editor (left sidebar)
-- 3. Click "New query", paste this entire file, and click "Run"
-- ============================================================

-- Users profile (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  profession text,
  company text,
  website_url text,
  brand_context jsonb default '{}',
  niche text,
  linkedin_niche_slug text,
  goals text[] default '{}',
  onboarding_complete boolean default false,
  blotato_linkedin_profile_id text,
  created_at timestamp with time zone default now()
);

-- Weekly content sessions
create table public.weekly_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  week_of date not null,
  question text,
  voice_note_path text,
  transcript text,
  draft_post text,
  final_post text,
  photo_path text,
  status text default 'pending' check (status in ('pending','transcribed','drafted','published','failed')),
  published_at timestamp with time zone,
  linkedin_post_id text,
  created_at timestamp with time zone default now(),
  unique(user_id, week_of)
);

-- Niche intelligence (weekly, reused across users with same niche)
create table public.niche_intelligence (
  id uuid default gen_random_uuid() primary key,
  niche text not null,
  week_of date not null,
  winning_format text,
  winning_hook text,
  topic_clusters text[] default '{}',
  sample_posts jsonb default '[]',
  generated_question text,
  updated_at timestamp with time zone default now(),
  unique(niche, week_of)
);

-- Post analytics
create table public.post_analytics (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.weekly_sessions(id) on delete cascade,
  impressions integer default 0,
  comments integer default 0,
  reposts integer default 0,
  reactions integer default 0,
  pulled_at timestamp with time zone default now()
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.weekly_sessions enable row level security;
alter table public.post_analytics enable row level security;
alter table public.niche_intelligence enable row level security;

create policy "Users manage own profile" on public.users for all using (auth.uid() = id);
create policy "Users manage own sessions" on public.weekly_sessions for all using (auth.uid() = user_id);
create policy "Users see own analytics" on public.post_analytics for all using (
  session_id in (select id from public.weekly_sessions where user_id = auth.uid())
);
create policy "Authenticated users read niche intel" on public.niche_intelligence
  for select using (auth.role() = 'authenticated');
create policy "Service role manages niche intel" on public.niche_intelligence
  for all using (auth.role() = 'service_role');

-- Storage bucket for voice notes and photos
insert into storage.buckets (id, name, public) values ('session-files', 'session-files', false);
create policy "Users upload own files" on storage.objects for insert with check (
  bucket_id = 'session-files' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users read own files" on storage.objects for select using (
  bucket_id = 'session-files' and auth.uid()::text = (storage.foldername(name))[1]
);
-- Needed for replacing a photo (uploads use upsert)
create policy "Users update own files" on storage.objects for update using (
  bucket_id = 'session-files' and auth.uid()::text = (storage.foldername(name))[1]
);
