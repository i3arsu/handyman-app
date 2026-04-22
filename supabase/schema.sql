-- ─────────────────────────────────────────────────────────────────────────────
-- HandyCraft — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
--    One row per auth.users entry. Written automatically on signup via trigger.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null,
  full_name              text,
  phone                  text,
  avatar_url             text,
  role                   text not null check (role in ('client', 'handyman')),
  notif_push             boolean not null default true,
  notif_email_marketing  boolean not null default false,
  notif_sms              boolean not null default true,
  expo_push_token        text,
  created_at             timestamptz default now() not null
);

-- Trigger: auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. JOBS
--    Posted by clients. Visible to all handymen on the map/list dashboard.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  description      text,
  category         text not null,
  address          text,
  location_lat     double precision,
  location_lng     double precision,
  scheduled_start  timestamptz,
  scheduled_end    timestamptz,
  payout           numeric(10, 2) not null default 0,
  is_urgent        boolean default false,
  status           text not null default 'open'
                   check (status in ('open', 'accepted', 'in_progress', 'completed', 'cancelled')),
  photo_urls       text[] not null default '{}',
  created_at       timestamptz default now() not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. JOB APPLICATIONS
--    Handyman applies to / accepts a job.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.job_applications (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  handyman_id   uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz default now() not null,
  unique (job_id, handyman_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles: users can read all profiles, update only their own
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- jobs: all authenticated users can read open jobs;
--       only the owning client can insert/update/delete
alter table public.jobs enable row level security;

create policy "Open jobs viewable by all authenticated users"
  on public.jobs for select
  to authenticated
  using (true);

create policy "Clients can insert their own jobs"
  on public.jobs for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "Clients can update their own jobs"
  on public.jobs for update
  to authenticated
  using (auth.uid() = client_id);

-- Lifecycle transitions (accepted -> in_progress -> completed) are driven
-- by the assigned handyman from JobInformationScreen.
create policy "Assigned handyman can update job"
  on public.jobs for update
  to authenticated
  using (auth.uid() = handyman_id)
  with check (auth.uid() = handyman_id);

create policy "Clients can delete their own jobs"
  on public.jobs for delete
  to authenticated
  using (auth.uid() = client_id);

-- job_applications: handymen can insert; owners and assigned handyman can read
alter table public.job_applications enable row level security;

create policy "Applications viewable by job owner and applicant"
  on public.job_applications for select
  to authenticated
  using (
    auth.uid() = handyman_id
    or auth.uid() = (select client_id from public.jobs where id = job_id)
  );

create policy "Handymen can apply to open jobs"
  on public.job_applications for insert
  to authenticated
  with check (auth.uid() = handyman_id);

create policy "Clients can update application status"
  on public.job_applications for update
  to authenticated
  using (
    auth.uid() = (select client_id from public.jobs where id = job_id)
  );

-- Handymen can withdraw their own pending application (DELETE).
create policy "Handymen can withdraw pending applications"
  on public.job_applications for delete
  to authenticated
  using (
    auth.uid() = handyman_id
    and status = 'pending'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS
--    In-app inbox. Rows are written by Postgres triggers on the event sources
--    (job_applications, jobs, messages). See migration 005_notifications.sql
--    for the full trigger definitions. Users can only see their own rows.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'application_withdrawn',
    'job_started',
    'job_completed',
    'job_cancelled',
    'new_message',
    'new_nearby_job'
  )),
  title       text not null,
  body        text not null,
  job_id      uuid references public.jobs(id) on delete cascade,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users update their own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users insert their own notifications"
  on public.notifications for insert
  to authenticated
  with check (user_id = auth.uid());
