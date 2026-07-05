-- Yet, We Can Heal -- Database schema (Phase 3)
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- after creating your project. Safe to run once on a fresh project.

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. ADMIN USERS (links to Supabase Auth's built-in auth.users)
-- ============================================================
-- Supabase Auth already handles email/password + sessions securely.
-- This table just stores the ROLE for each authenticated person, since
-- auth.users itself has no concept of "Super Admin" vs "Editor".
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('super_admin', 'editor')),
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- ============================================================
-- 3. EMOTIONS (admin-manageable list used by check-in, filters, tags)
-- ============================================================
create table if not exists public.emotions (
  id text primary key, -- e.g. 'heartbroken', matches lib/emotions.ts ids
  name text not null,
  description text
);

insert into public.emotions (id, name, description) values
  ('heartbroken', 'Heartbroken', null),
  ('lonely', 'Lonely', null),
  ('angry', 'Angry', null),
  ('ashamed', 'Ashamed', null),
  ('numb', 'Numb', null),
  ('afraid', 'Afraid', null),
  ('hopeless', 'Hopeless', null),
  ('hopeful', 'Hopeful', null)
on conflict (id) do nothing;

-- ============================================================
-- 4. STORIES
-- ============================================================
create table if not exists public.stories (
  id uuid primary key default uuid_generate_v4(),
  title text,
  body text not null,
  what_helped_heal text not null,
  emotion_tags text[] not null default '{}',
  other_emotion text, -- free-text "Other emotion" from submission form, reviewed by admin
  trigger_warning text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  read_count integer not null default 0,
  helpful_count integer not null default 0,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.admin_profiles(id),
  reviewed_at timestamptz,
  admin_notes text
);

-- ============================================================
-- 5. VOLUNTEER APPLICATIONS
-- ============================================================
create table if not exists public.volunteer_applications (
  id uuid primary key default uuid_generate_v4(),
  alias text not null,
  contact text not null,
  motivation text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- 6. WAITLIST SIGNUPS (Community -- Coming Soon)
-- ============================================================
create table if not exists public.waitlist_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- 7. ARTICLES
-- ============================================================
create table if not exists public.articles (
  slug text primary key,
  title text not null,
  excerpt text not null,
  body text not null,
  emotion_tags text[] not null default '{}'
);

-- ============================================================
-- 8. SITE METRICS (raw event log; rolled up for dashboard views)
-- ============================================================
create table if not exists public.site_metrics (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null check (
    event_type in ('page_view', 'story_read', 'submission', 'waitlist_join', 'emotion_selected')
  ),
  story_id uuid references public.stories(id) on delete set null,
  emotion text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. ACTIVITY LOG (accountability trail for admin actions)
-- ============================================================
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.admin_profiles(id),
  actor_email text not null,
  action text not null, -- e.g. 'story_approved', 'story_rejected', 'story_edited', 'admin_added', 'admin_removed'
  target_type text not null, -- e.g. 'story', 'admin_profile'
  target_id text,
  details text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

alter table public.stories enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.waitlist_signups enable row level security;
alter table public.articles enable row level security;
alter table public.emotions enable row level security;
alter table public.site_metrics enable row level security;
alter table public.activity_log enable row level security;
alter table public.admin_profiles enable row level security;

-- Helper: is the current authenticated user an admin (either role)?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_profiles where id = auth.uid()
  );
$$;

-- Helper: is the current authenticated user specifically a super_admin?
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Counters below use SECURITY DEFINER so anonymous visitors can increment
-- read/helpful counts without needing general UPDATE access to stories
-- (which is restricted to admins by the policy further down).
create or replace function public.increment_read_count(story_id uuid)
returns void
language sql
security definer
as $$
  update public.stories set read_count = read_count + 1 where id = story_id;
$$;

create or replace function public.increment_helpful_count(story_id uuid)
returns void
language sql
security definer
as $$
  update public.stories set helpful_count = helpful_count + 1 where id = story_id;
$$;

-- STORIES: public can read only approved stories. Admins can read everything.
create policy "Public can read approved stories"
  on public.stories for select
  using (status = 'approved' or public.is_admin());

-- STORIES: anyone (including anonymous visitors) can submit a story --
-- it always lands as 'pending' regardless of what the client sends.
create policy "Anyone can submit a story"
  on public.stories for insert
  with check (status = 'pending');

-- STORIES: only admins can update (approve/reject/edit).
create policy "Admins can update stories"
  on public.stories for update
  using (public.is_admin());

-- STORIES: only admins can delete.
create policy "Admins can delete stories"
  on public.stories for delete
  using (public.is_admin());

-- EMOTIONS: readable by everyone; only admins can manage the list.
create policy "Anyone can read emotions"
  on public.emotions for select
  using (true);

create policy "Admins can manage emotions"
  on public.emotions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ARTICLES: readable by everyone; only admins can manage.
create policy "Anyone can read articles"
  on public.articles for select
  using (true);

create policy "Admins can manage articles"
  on public.articles for all
  using (public.is_admin())
  with check (public.is_admin());

-- VOLUNTEER APPLICATIONS: anyone can submit; only admins can read/manage.
create policy "Anyone can apply to volunteer"
  on public.volunteer_applications for insert
  with check (status = 'pending');

create policy "Admins can read volunteer applications"
  on public.volunteer_applications for select
  using (public.is_admin());

create policy "Admins can update volunteer applications"
  on public.volunteer_applications for update
  using (public.is_admin());

-- WAITLIST: anyone can join; only admins can read the list.
create policy "Anyone can join the waitlist"
  on public.waitlist_signups for insert
  with check (true);

create policy "Admins can read waitlist"
  on public.waitlist_signups for select
  using (public.is_admin());

-- SITE METRICS: anyone can log an event; only admins can read/aggregate.
create policy "Anyone can log a metric event"
  on public.site_metrics for insert
  with check (true);

create policy "Admins can read metrics"
  on public.site_metrics for select
  using (public.is_admin());

-- ACTIVITY LOG: only admins can read. Only admins can write (enforced in
-- API routes, which always insert as the authenticated admin performing
-- the action -- never as a value the client can spoof).
create policy "Admins can read activity log"
  on public.activity_log for select
  using (public.is_admin());

create policy "Admins can write activity log"
  on public.activity_log for insert
  with check (public.is_admin());

-- ADMIN PROFILES: admins can read the team list. Only Super Admins can
-- add/remove/edit team members -- this is the role management boundary.
create policy "Admins can read admin profiles"
  on public.admin_profiles for select
  using (public.is_admin());

create policy "Super admins can insert admin profiles"
  on public.admin_profiles for insert
  with check (public.is_super_admin());

create policy "Super admins can update admin profiles"
  on public.admin_profiles for update
  using (public.is_super_admin());

create policy "Super admins can delete admin profiles"
  on public.admin_profiles for delete
  using (public.is_super_admin());

-- ============================================================
-- 11. SEED ARTICLES (matches lib/seed-articles.ts content)
-- ============================================================
insert into public.articles (slug, title, excerpt, body, emotion_tags) values
  ('why-healing-feels-slow', 'Why healing feels slow',
   'It''s not you doing it wrong. Healing was never supposed to move in a straight line.',
   E'There''s an idea that healing should feel like progress -- steady, visible, upward. In reality, it''s closer to weather. Some days are clear. Some days a storm you thought had passed circles back.\n\nThis doesn''t mean you''re failing. It means you''re human, moving through something that doesn''t have a fixed timeline. Slow isn''t the same as stuck.',
   array['hopeless','numb']),
  ('coping-with-emotional-pain', 'Coping with emotional pain',
   'A few small, ordinary ways to get through the heaviest days.',
   E'You don''t need a perfect coping strategy -- you need a handful of small, ordinary things you can reach for when it gets heavy. Naming the feeling out loud, even just to yourself. Stepping outside for five minutes. Reaching out to one person, even with a short message.\n\nNone of these fix the pain. They just help you carry it a little longer, until it feels lighter on its own.',
   array['heartbroken','angry']),
  ('learning-to-trust-again', 'Learning to trust again',
   'Trust doesn''t return all at once. It returns in small, testable doses.',
   E'After being hurt, trust can feel like a switch that got broken -- all or nothing. But trust actually rebuilds in small, testable doses: someone keeps a small promise, and something in you loosens slightly. It happens slower than you''d like, and that''s normal.\n\nYou''re allowed to trust cautiously. Caution isn''t the opposite of healing -- it''s often part of it.',
   array['afraid','ashamed']),
  ('healing-after-betrayal', 'Healing after betrayal',
   'Betrayal doesn''t just hurt -- it rewrites what you thought you knew.',
   E'Betrayal has a particular sting because it doesn''t just hurt in the moment -- it makes you question things you thought were solid. Healing here often means grieving the version of events you believed in, not just the relationship or person.\n\nGive yourself permission to mourn that, too.',
   array['angry','afraid']),
  ('managing-loneliness', 'Managing loneliness',
   'Loneliness lies. It tells you you''re the only one who feels this way.',
   E'Loneliness has a way of convincing you that you''re uniquely alone in what you''re feeling -- that everyone else has it figured out. That''s rarely true. It''s just that most people don''t say it out loud.\n\nIf you''re reading this, you''re already doing something about it: looking for something that says you''re not the only one.',
   array['lonely','numb'])
on conflict (slug) do nothing;
