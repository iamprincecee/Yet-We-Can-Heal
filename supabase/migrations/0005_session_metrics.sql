-- Yet, We Can Heal -- Session-based metrics (unique visitors + honest time-on-site)
-- Run this in the Supabase SQL Editor AFTER 0001_init.sql.
-- Safe to re-run.

-- Add a session id + last-seen column to site_metrics so we can distinguish
-- unique visitors and measure engaged time (see 0006 note below on why this
-- is more honest than naive time-on-page).
alter table public.site_metrics
  add column if not exists session_id text;

-- The check constraint on event_type needs to allow the new 'heartbeat' event.
-- Drop and recreate it with the expanded list.
alter table public.site_metrics
  drop constraint if exists site_metrics_event_type_check;

alter table public.site_metrics
  add constraint site_metrics_event_type_check
  check (event_type in (
    'page_view',
    'story_read',
    'submission',
    'waitlist_join',
    'emotion_selected',
    'heartbeat'
  ));

-- Index to make the per-session rollups fast as data grows.
create index if not exists site_metrics_session_idx
  on public.site_metrics (session_id, created_at);
