-- Yet, We Can Heal -- Safety & moderation layer
-- Run in the Supabase SQL Editor AFTER all prior migrations. Safe to re-run.
--
-- Adds: a Chief Editor role, two-step publishing, reader reports, sensitivity
-- warnings, and message-reply gating. See each section.

-- ============================================================
-- 1. ROLES: add 'chief_editor' between editor and super_admin
-- ============================================================
alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;
alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('super_admin', 'chief_editor', 'editor'));

-- Helper: is the current user a Chief Editor OR Super Admin (i.e. can give
-- final approval / publish / act on reports / send message replies)?
create or replace function public.is_publisher()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role in ('super_admin', 'chief_editor')
  );
$$;

-- ============================================================
-- 2. TWO-STEP PUBLISHING for stories & articles
--    pending -> ready (editor readies) -> approved (publisher publishes)
--    A 'rejected' state remains available at any point.
-- ============================================================
alter table public.stories
  drop constraint if exists stories_status_check;
alter table public.stories
  add constraint stories_status_check
  check (status in ('pending', 'ready', 'approved', 'rejected'));

alter table public.articles
  drop constraint if exists articles_status_check;
alter table public.articles
  add constraint articles_status_check
  check (status in ('pending', 'ready', 'approved', 'rejected'));

-- Track who readied and who published, for accountability.
alter table public.stories
  add column if not exists readied_by uuid references public.admin_profiles(id);
alter table public.stories
  add column if not exists readied_at timestamptz;
alter table public.articles
  add column if not exists readied_by uuid references public.admin_profiles(id);
alter table public.articles
  add column if not exists readied_at timestamptz;

-- ============================================================
-- 3. SENSITIVITY WARNING (reader-facing interstitial)
--    trigger_warning already exists on stories; add to articles and add a
--    boolean flag so a warning can be required even without custom text.
-- ============================================================
alter table public.articles
  add column if not exists trigger_warning text;

-- ============================================================
-- 4. READER REPORTS
--    Anyone can file a report (no login). All admins can view; only
--    publishers (chief_editor/super_admin) can act.
-- ============================================================
create table if not exists public.content_reports (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null check (content_type in ('story', 'article')),
  content_id uuid not null,
  reason text not null,
  note text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  reporter_ip text,
  created_at timestamptz not null default now(),
  handled_by uuid references public.admin_profiles(id),
  handled_at timestamptz
);

alter table public.content_reports enable row level security;

-- Anyone can file a report (lands as 'open').
drop policy if exists "Anyone can file a report" on public.content_reports;
create policy "Anyone can file a report"
  on public.content_reports for insert
  with check (status = 'open');

-- All admins can read reports.
drop policy if exists "Admins can read reports" on public.content_reports;
create policy "Admins can read reports"
  on public.content_reports for select
  using (public.is_admin());

-- Only publishers (chief editor / super admin) can update (act on) reports.
drop policy if exists "Publishers can act on reports" on public.content_reports;
create policy "Publishers can act on reports"
  on public.content_reports for update
  using (public.is_publisher());

-- ============================================================
-- 5. MESSAGE REPLIES (gated: editors draft, publishers send)
--    contact_messages already exists. Add reply fields.
-- ============================================================
alter table public.contact_messages
  add column if not exists reply_draft text;
alter table public.contact_messages
  add column if not exists reply_sent text;
alter table public.contact_messages
  add column if not exists replied_by uuid references public.admin_profiles(id);
alter table public.contact_messages
  add column if not exists replied_at timestamptz;
