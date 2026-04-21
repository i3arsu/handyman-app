-- Job photos: store uploaded image URLs on jobs and configure a Storage
-- bucket with RLS so clients can upload their own, and anyone authenticated
-- can read (to render them in handyman-facing screens).
--
-- Run this in the Supabase SQL editor. The storage policies are written to
-- be idempotent so re-running is safe.

-- ─── 1. Column on jobs ────────────────────────────────────────────────────────
alter table public.jobs
  add column if not exists photo_urls text[] not null default '{}';

-- ─── 2. Storage bucket ────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

-- ─── 3. Storage RLS ───────────────────────────────────────────────────────────
-- Path convention: <client_id>/<job_draft_uuid>/<filename>. We scope writes
-- to the uploader's own top-level folder.

drop policy if exists "job-photos: read (public)"     on storage.objects;
drop policy if exists "job-photos: upload (own folder)" on storage.objects;
drop policy if exists "job-photos: delete (own folder)" on storage.objects;

create policy "job-photos: read (public)"
  on storage.objects for select
  using (bucket_id = 'job-photos');

create policy "job-photos: upload (own folder)"
  on storage.objects for insert
  with check (
    bucket_id = 'job-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "job-photos: delete (own folder)"
  on storage.objects for delete
  using (
    bucket_id = 'job-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
