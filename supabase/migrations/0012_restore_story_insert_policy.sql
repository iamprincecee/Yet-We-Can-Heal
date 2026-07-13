-- Yet, We Can Heal -- Restore the public story-submission policy
-- Run in the Supabase SQL Editor. Safe to re-run.
--
-- The "Anyone can submit a story" INSERT policy was only ever created in
-- 0001 and never re-created, so if it went missing on a live database,
-- nothing restored it -- causing "new row violates row-level security policy"
-- on story submission (while articles, whose policy is re-created in 0006,
-- kept working). This migration restores it idempotently.

drop policy if exists "Anyone can submit a story" on public.stories;
create policy "Anyone can submit a story"
  on public.stories for insert
  with check (status = 'pending');
