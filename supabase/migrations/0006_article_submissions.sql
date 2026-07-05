-- Yet, We Can Heal -- Article submissions (public can submit, admins review)
-- Run in the Supabase SQL Editor AFTER 0001_init.sql. Safe to re-run.
--
-- The original articles table used `slug` as its PRIMARY KEY. Public
-- submissions need a stable id, a moderation status, and optional authorship,
-- and a pending submission has no slug yet. So we must move the primary key
-- off `slug` and onto a new `id` before we can allow slug to be null.

-- 1. Add the columns first (id + moderation + authorship).
alter table public.articles
  add column if not exists id uuid not null default uuid_generate_v4();

alter table public.articles
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected'));

alter table public.articles
  add column if not exists is_anonymous boolean not null default true;

alter table public.articles
  add column if not exists author_name text;

alter table public.articles
  add column if not exists author_link text;

alter table public.articles
  add column if not exists submitted_at timestamptz not null default now();

alter table public.articles
  add column if not exists admin_notes text;

-- 2. Move the PRIMARY KEY from slug to id.
--    Drop the existing primary key constraint (named articles_pkey by default),
--    then make id the new primary key.
alter table public.articles drop constraint if exists articles_pkey;
alter table public.articles add primary key (id);

-- 3. Now slug can be null (pending submissions have no slug until approval).
alter table public.articles alter column slug drop not null;

-- 4. Keep slugs unique when present (many NULLs allowed, no duplicate slugs).
create unique index if not exists articles_slug_unique
  on public.articles (slug) where slug is not null;

-- 5. RLS: public reads only approved articles; anyone can submit as pending.
drop policy if exists "Anyone can read articles" on public.articles;
drop policy if exists "Public can read approved articles" on public.articles;
create policy "Public can read approved articles"
  on public.articles for select
  using (status = 'approved' or public.is_admin());

drop policy if exists "Anyone can submit an article" on public.articles;
create policy "Anyone can submit an article"
  on public.articles for insert
  with check (status = 'pending');

-- The 0001 "Admins can manage articles" (for all) policy still covers admin
-- insert/update/delete, so admin-written articles and approvals work.
