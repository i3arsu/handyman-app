-- ─────────────────────────────────────────────────────────────────────────────
-- HandyCraft — Messages Table
-- Run this in the Supabase SQL Editor after schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(content) > 0),
  created_at  timestamptz default now() not null
);

-- Index for fast per-job message queries
create index if not exists messages_job_id_idx on public.messages(job_id, created_at);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.messages enable row level security;

-- Clients can read messages on their own jobs
create policy "Clients read their job messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = messages.job_id
        and jobs.client_id = auth.uid()
    )
  );

-- Handymen can read messages on jobs they have an accepted application for
create policy "Handymen read their job messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.job_applications
      where job_applications.job_id = messages.job_id
        and job_applications.handyman_id = auth.uid()
        and job_applications.status = 'accepted'
    )
  );

-- Clients can send messages on their own jobs
create policy "Clients insert messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.jobs
      where jobs.id = messages.job_id
        and jobs.client_id = auth.uid()
    )
  );

-- Handymen can send messages on jobs they have an accepted application for
create policy "Handymen insert messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.job_applications
      where job_applications.job_id = messages.job_id
        and job_applications.handyman_id = auth.uid()
        and job_applications.status = 'accepted'
    )
  );

-- ─── Enable Realtime ──────────────────────────────────────────────────────────
-- Run this to enable real-time events for the messages table.
-- (Supabase Dashboard → Database → Replication → Add table → messages)
-- Or via SQL:
alter publication supabase_realtime add table public.messages;
