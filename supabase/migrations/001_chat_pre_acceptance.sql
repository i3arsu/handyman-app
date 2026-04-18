-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: allow chat while an application is still pending
-- Run in Supabase SQL Editor
--
-- Before: handymen could only read/send messages on jobs with an
--         application in status='accepted'.
-- After:  handymen with a 'pending' OR 'accepted' application can read
--         and send messages. Rejected applicants lose access.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Handymen read their job messages"   on public.messages;
drop policy if exists "Handymen insert messages"           on public.messages;

create policy "Handymen read their job messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.job_applications
      where job_applications.job_id = messages.job_id
        and job_applications.handyman_id = auth.uid()
        and job_applications.status in ('pending', 'accepted')
    )
  );

create policy "Handymen insert messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.job_applications
      where job_applications.job_id = messages.job_id
        and job_applications.handyman_id = auth.uid()
        and job_applications.status in ('pending', 'accepted')
    )
  );
