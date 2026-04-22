-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: cancel (client) + withdraw (handyman) flow
-- Run in Supabase SQL Editor.
--
-- Adds:
--   * Two new notification types: 'job_cancelled', 'application_withdrawn'
--   * RLS DELETE policy so a handyman can withdraw their own pending application
--   * Extended notify_job_lifecycle trigger: also fans out 'job_cancelled'
--     to the assigned handyman (if any) or every pending applicant
--   * New notify_application_withdrawn trigger on DELETE: notifies the client
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Widen notifications.type check constraint ───────────────────────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'application_withdrawn',
    'job_started',
    'job_completed',
    'job_cancelled',
    'new_message',
    'new_nearby_job'
  ));

-- ─── RLS: handymen can withdraw their own pending application ────────────────
drop policy if exists "Handymen can withdraw pending applications" on public.job_applications;
create policy "Handymen can withdraw pending applications"
  on public.job_applications for delete
  to authenticated
  using (
    auth.uid() = handyman_id
    and status = 'pending'
  );

-- ─── Trigger: extend notify_job_lifecycle to cover 'cancelled' ───────────────
create or replace function public.notify_job_lifecycle()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_rec record;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'in_progress' then
    if public.notif_enabled(new.client_id) then
      insert into public.notifications (user_id, type, title, body, job_id)
      values (
        new.client_id,
        'job_started',
        'Your pro has started',
        'Work has begun on "' || new.title || '".',
        new.id
      );
    end if;
    return new;
  end if;

  if new.status = 'completed' then
    if public.notif_enabled(new.client_id) then
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
  end if;

  if new.status = 'cancelled' then
    -- Notify the assigned handyman if one exists; otherwise every pending applicant.
    if new.handyman_id is not null then
      if public.notif_enabled(new.handyman_id) then
        insert into public.notifications (user_id, type, title, body, job_id)
        values (
          new.handyman_id,
          'job_cancelled',
          'Job cancelled',
          'The client cancelled "' || new.title || '".',
          new.id
        );
      end if;
    else
      for v_rec in
        select handyman_id from public.job_applications
        where job_id = new.id and status = 'pending'
      loop
        if public.notif_enabled(v_rec.handyman_id) then
          insert into public.notifications (user_id, type, title, body, job_id)
          values (
            v_rec.handyman_id,
            'job_cancelled',
            'Job cancelled',
            'The client cancelled "' || new.title || '" before selecting a pro.',
            new.id
          );
        end if;
      end loop;
    end if;
    return new;
  end if;

  return new;
end;
$$;

-- ─── Trigger: handyman withdrew a pending application → notify client ────────
create or replace function public.notify_application_withdrawn()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_job_title text;
  v_handyman_name text;
begin
  if old.status <> 'pending' then
    return old;
  end if;

  select j.client_id, j.title
    into v_client_id, v_job_title
  from public.jobs j
  where j.id = old.job_id;

  if v_client_id is null or not public.notif_enabled(v_client_id) then
    return old;
  end if;

  select coalesce(p.full_name, 'A handyman')
    into v_handyman_name
  from public.profiles p
  where p.id = old.handyman_id;

  insert into public.notifications (user_id, type, title, body, job_id)
  values (
    v_client_id,
    'application_withdrawn',
    v_handyman_name || ' withdrew',
    v_handyman_name || ' is no longer applying for "' || v_job_title || '".',
    old.job_id
  );

  return old;
end;
$$;

drop trigger if exists on_application_delete on public.job_applications;
create trigger on_application_delete
  after delete on public.job_applications
  for each row execute procedure public.notify_application_withdrawn();
