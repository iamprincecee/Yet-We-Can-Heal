-- Yet, We Can Heal -- Team members (public About page)
-- Run this in the Supabase SQL Editor AFTER 0001_init.sql.
-- Safe to run more than once (drops policies first, so no "already exists").
--
-- IMPORTANT: This file only creates the TABLE. Photo storage (the bucket and
-- its upload policies) is handled separately in 0004_team_photos_storage.sql,
-- because bucket creation via SQL can fail on some projects and shouldn't be
-- allowed to abort the table creation.

create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null,
  bio text,
  photo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

-- Drop-then-create so this file is safe to re-run.
drop policy if exists "Anyone can read team members" on public.team_members;
create policy "Anyone can read team members"
  on public.team_members for select
  using (true);

drop policy if exists "Super admins can manage team members" on public.team_members;
create policy "Super admins can manage team members"
  on public.team_members for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
