-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: in-app notifications
-- Run in Supabase SQL Editor.
--
-- Adds:
--   * public.notifications table (in-app inbox; one row per event per recipient)
--   * RLS so users can only read/update their own
--   * Trigger functions fired by the event sources (applications, jobs, messages)
--   * Respects profiles.notif_push — if false for the recipient, skip insert
--
-- Architecturally this is the "inbox" store. A later migration can add a
-- pg_notify-based worker for push/email/SMS fan-out without changing the
-- read path.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Table ────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'job_started',
    'job_completed',
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

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.notifications enable row level security;

drop policy if exists "Users read their own notifications" on public.notifications;
create policy "Users read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users update their own notifications" on public.notifications;
create policy "Users update their own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Client-side inserts (used for the handyman "new nearby job" path, where the
-- recipient is the caller themselves — fan-out by radius is done client-side
-- because the radius lives in AsyncStorage).
drop policy if exists "Users insert their own notifications" on public.notifications;
create policy "Users insert their own notifications"
  on public.notifications for insert
  to authenticated
  with check (user_id = auth.uid());

-- ─── Helper: respect the recipient's notification preference ─────────────────
create or replace function public.notif_enabled(recipient uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select notif_push from public.profiles where id = recipient), true);
$$;

-- ─── Trigger: new application received → notify the job's client ─────────────
create or replace function public.notify_application_received()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_job_title text;
  v_handyman_name text;
begin
  select j.client_id, j.title
    into v_client_id, v_job_title
  from public.jobs j
  where j.id = new.job_id;

  if v_client_id is null or not public.notif_enabled(v_client_id) then
    return new;
  end if;

  select coalesce(p.full_name, 'A handyman')
    into v_handyman_name
  from public.profiles p
  where p.id = new.handyman_id;

  insert into public.notifications (user_id, type, title, body, job_id)
  values (
    v_client_id,
    'application_received',
    'New applicant on ' || v_job_title,
    v_handyman_name || ' applied for your job. Tap to review.',
    new.job_id
  );

  return new;
end;
$$;

drop trigger if exists on_application_insert on public.job_applications;
create trigger on_application_insert
  after insert on public.job_applications
  for each row execute procedure public.notify_application_received();

-- ─── Trigger: application status change → notify the handyman ────────────────
create or replace function public.notify_application_decided()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_job_title text;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status not in ('accepted', 'rejected') then
    return new;
  end if;

  if not public.notif_enabled(new.handyman_id) then
    return new;
  end if;

  select title into v_job_title from public.jobs where id = new.job_id;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, title, body, job_id)
    values (
      new.handyman_id,
      'application_accepted',
      'You got the job!',
      'You were accepted for "' || v_job_title || '". Start when ready.',
      new.job_id
    );
  else
    insert into public.notifications (user_id, type, title, body, job_id)
    values (
      new.handyman_id,
      'application_rejected',
      'Application closed',
      'The client chose another pro for "' || v_job_title || '".',
      new.job_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_application_update on public.job_applications;
create trigger on_application_update
  after update on public.job_applications
  for each row execute procedure public.notify_application_decided();

-- ─── Trigger: job lifecycle change → notify the client ───────────────────────
create or replace function public.notify_job_lifecycle()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status not in ('in_progress', 'completed') then
    return new;
  end if;

  if not public.notif_enabled(new.client_id) then
    return new;
  end if;

  if new.status = 'in_progress' then
    insert into public.notifications (user_id, type, title, body, job_id)
    values (
      new.client_id,
      'job_started',
      'Your pro has started',
      'Work has begun on "' || new.title || '".',
      new.id
    );
  else
    insert into public.notifications (user_id, type, title, body, job_id)
    values (
      new.client_id,
      'job_completed',
      'Job completed',
      '"' || new.title || '" is marked complete.',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_job_status_update on public.jobs;
create trigger on_job_status_update
  after update on public.jobs
  for each row execute procedure public.notify_job_lifecycle();

-- ─── Trigger: new message → notify the counterparty ─────────────────────────
-- If the sender is the job's client, notify every handyman with an active
-- (pending or accepted) application on that job. Otherwise the sender is a
-- handyman — notify the client.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_job_title text;
  v_sender_name text;
  v_preview text;
begin
  select j.client_id, j.title
    into v_client_id, v_job_title
  from public.jobs j
  where j.id = new.job_id;

  select coalesce(p.full_name, 'Someone')
    into v_sender_name
  from public.profiles p
  where p.id = new.sender_id;

  v_preview := case
    when char_length(new.content) > 90
      then substring(new.content from 1 for 87) || '...'
    else new.content
  end;

  if new.sender_id = v_client_id then
    -- Client → each active applicant
    insert into public.notifications (user_id, type, title, body, job_id)
    select ja.handyman_id,
           'new_message',
           'Message from ' || v_sender_name,
           v_preview,
           new.job_id
    from public.job_applications ja
    where ja.job_id = new.job_id
      and ja.status in ('pending', 'accepted')
      and public.notif_enabled(ja.handyman_id);
  else
    if v_client_id is not null and public.notif_enabled(v_client_id) then
      insert into public.notifications (user_id, type, title, body, job_id)
      values (
        v_client_id,
        'new_message',
        'Message from ' || v_sender_name,
        v_preview,
        new.job_id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure public.notify_new_message();

-- ─── Enable Realtime ─────────────────────────────────────────────────────────
-- Required so the client can subscribe to INSERTs on the inbox.
alter publication supabase_realtime add table public.notifications;
