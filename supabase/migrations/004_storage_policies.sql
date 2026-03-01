-- Storage policies for post-images bucket
-- Run this in Supabase SQL Editor if uploads fail with "new row violates row-level security" or similar.

-- 1. Allow authenticated users to UPLOAD (INSERT) to post-images
drop policy if exists "Allow authenticated uploads to post-images" on storage.objects;
create policy "Allow authenticated uploads to post-images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'post-images');

-- 2. Allow anyone to READ (SELECT) from post-images (public images)
drop policy if exists "Allow public read post-images" on storage.objects;
create policy "Allow public read post-images"
on storage.objects
for select
to public
using (bucket_id = 'post-images');

-- 3. Allow authenticated users to UPDATE their uploads (optional, for replacing images)
drop policy if exists "Allow authenticated update post-images" on storage.objects;
create policy "Allow authenticated update post-images"
on storage.objects
for update
to authenticated
using (bucket_id = 'post-images')
with check (bucket_id = 'post-images');
