-- Yet, We Can Heal -- Founder flag for admin_profiles
-- Run in the Supabase SQL Editor AFTER 0001_init.sql. Safe to re-run.
--
-- Adds an `is_founder` flag. The founding Super Admin is the one account that
-- can remove OTHER super admins; regular super admins can only remove editors.
-- This prevents a promoted super admin from ever ousting the owner.

alter table public.admin_profiles
  add column if not exists is_founder boolean not null default false;

-- Mark the founding super admin. REPLACE the email below with YOUR email if
-- different. This sets exactly one founder; if you have multiple super admins
-- already, only this one becomes the founder.
update public.admin_profiles
  set is_founder = true
  where email = 'iamprincecee@gmail.com';

-- Safety: if for some reason no row matched above (email typo, etc.), you can
-- fall back to marking the earliest-created super admin as founder by running
-- this instead (commented out -- uncomment only if the update above set none):
--
-- update public.admin_profiles set is_founder = true
--   where id = (
--     select id from public.admin_profiles
--     where role = 'super_admin' order by created_at asc limit 1
--   );
