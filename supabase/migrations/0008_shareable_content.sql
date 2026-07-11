-- Yet, We Can Heal -- Shareable content: optional image for stories & articles
-- Run in the Supabase SQL Editor AFTER 0001_init.sql. Safe to re-run.
--
-- Adds an optional image URL to stories and articles. Admins can attach or
-- change this image in the moderation queue before publishing. The image is
-- used both on the page and as the Open Graph preview when the link is shared.

alter table public.stories
  add column if not exists image_url text;

alter table public.articles
  add column if not exists image_url text;

-- Storage bucket for these content images (public, so previews work when
-- shared). Only admins can upload/change — enforced by the policies below.
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view content images" on storage.objects;
create policy "Public can view content images"
  on storage.objects for select
  using (bucket_id = 'content-images');

drop policy if exists "Admins can upload content images" on storage.objects;
create policy "Admins can upload content images"
  on storage.objects for insert
  with check (bucket_id = 'content-images' and public.is_admin());

drop policy if exists "Admins can update content images" on storage.objects;
create policy "Admins can update content images"
  on storage.objects for update
  using (bucket_id = 'content-images' and public.is_admin());

drop policy if exists "Admins can delete content images" on storage.objects;
create policy "Admins can delete content images"
  on storage.objects for delete
  using (bucket_id = 'content-images' and public.is_admin());
