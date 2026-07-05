-- Yet, We Can Heal -- Contact messages (adds to Phase 3 schema)
-- Run this in the Supabase SQL Editor AFTER 0001_init.sql.
-- Safe to run once on a project that already has the base schema.

-- ============================================================
-- CONTACT MESSAGES (public can send; all admins can read/manage)
-- ============================================================
create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  submitted_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (including anonymous visitors) can send a message. It always lands
-- as 'new' regardless of what the client sends.
create policy "Anyone can send a contact message"
  on public.contact_messages for insert
  with check (status = 'new');

-- All admins (Editor or Super Admin) can read every message.
create policy "Admins can read contact messages"
  on public.contact_messages for select
  using (public.is_admin());

-- Admins can update a message's status (new -> read -> archived).
create policy "Admins can update contact messages"
  on public.contact_messages for update
  using (public.is_admin());
