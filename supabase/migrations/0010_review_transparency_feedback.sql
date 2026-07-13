-- Yet, We Can Heal -- Review transparency + impact feedback
-- Run in the Supabase SQL Editor AFTER 0009. Safe to re-run.

-- ============================================================
-- 1. ORIGINAL SNAPSHOTS
--    When an admin first edits a submission, the untouched original is
--    preserved so Chief Editors can compare the original vs the edited
--    version before final publication. Snapshotting happens in the edit
--    routes (application code) the first time an edit is saved.
-- ============================================================
alter table public.stories
  add column if not exists original_title text;
alter table public.stories
  add column if not exists original_body text;
alter table public.stories
  add column if not exists original_what_helped text;

alter table public.articles
  add column if not exists original_title text;
alter table public.articles
  add column if not exists original_excerpt text;
alter table public.articles
  add column if not exists original_body text;

-- ============================================================
-- 2. IMPACT FEEDBACK (the positive counterpart to reports)
--    After marking a story/article helpful, readers may leave a short
--    optional note about how it helped. Public insert, admin read.
-- ============================================================
create table if not exists public.content_feedback (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null check (content_type in ('story', 'article')),
  content_id uuid not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.content_feedback enable row level security;

drop policy if exists "Anyone can leave feedback" on public.content_feedback;
create policy "Anyone can leave feedback"
  on public.content_feedback for insert
  with check (true);

drop policy if exists "Admins can read feedback" on public.content_feedback;
create policy "Admins can read feedback"
  on public.content_feedback for select
  using (public.is_admin());
