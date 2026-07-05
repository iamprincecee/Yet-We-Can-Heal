-- Yet, We Can Heal -- Team photo storage (bucket + policies)
-- Run this AFTER 0003_team_members.sql.
--
-- RECOMMENDED: create the bucket via the Supabase dashboard instead of SQL --
-- Storage -> New bucket -> name "team-photos" -> toggle "Public bucket" ON.
-- Creating buckets through SQL can be blocked on some projects. The insert
-- below tries anyway and is harmless if the bucket already exists.
--
-- Safe to re-run: policies are dropped first.

-- Try to create the bucket (no-op if it already exists or if blocked).
insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

-- Public can view team photos (needed for the public About page).
drop policy if exists "Public can view team photos" on storage.objects;
create policy "Public can view team photos"
  on storage.objects for select
  using (bucket_id = 'team-photos');

-- Only Super Admins can upload team photos.
drop policy if exists "Super admins can upload team photos" on storage.objects;
create policy "Super admins can upload team photos"
  on storage.objects for insert
  with check (bucket_id = 'team-photos' and public.is_super_admin());

-- Only Super Admins can update team photos.
drop policy if exists "Super admins can update team photos" on storage.objects;
create policy "Super admins can update team photos"
  on storage.objects for update
  using (bucket_id = 'team-photos' and public.is_super_admin());

-- Only Super Admins can delete team photos.
drop policy if exists "Super admins can delete team photos" on storage.objects;
create policy "Super admins can delete team photos"
  on storage.objects for delete
  using (bucket_id = 'team-photos' and public.is_super_admin());
EOF
