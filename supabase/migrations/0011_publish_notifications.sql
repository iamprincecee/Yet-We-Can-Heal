-- Yet, We Can Heal -- Publish notifications
-- Run in the Supabase SQL Editor AFTER 0010. Safe to re-run.
--
-- Submitters may OPTIONALLY leave an email to be notified when their story or
-- article is published. The email is never displayed anywhere; it exists only
-- to send the one notification, and notified_at records that it was sent.

alter table public.stories
  add column if not exists notify_email text;
alter table public.stories
  add column if not exists notified_at timestamptz;

alter table public.articles
  add column if not exists notify_email text;
alter table public.articles
  add column if not exists notified_at timestamptz;
