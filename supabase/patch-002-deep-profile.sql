-- Attntion v2: deep profile (onboarding step 4) + richer niche intelligence.
-- Run once in the Supabase SQL editor. Safe to re-run.
alter table public.users
  add column if not exists profile_type text,
  add column if not exists industry text,
  add column if not exists company_stage text,
  add column if not exists core_function text,
  add column if not exists consulting_focus text,
  add column if not exists career_goal text,
  add column if not exists content_angles text[] default '{}',
  add column if not exists target_audience text[] default '{}',
  add column if not exists communication_tone text,
  add column if not exists linkedin_fear text;

alter table public.niche_intelligence
  add column if not exists insight_summary text;
