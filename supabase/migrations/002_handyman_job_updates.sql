-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: allow the assigned handyman to update their own job
-- Run in Supabase SQL Editor
--
-- Context: lifecycle transitions (accepted -> in_progress -> completed) are
-- driven by the handyman from JobInformationScreen. Previously only the
-- client could update the jobs row, which blocked those status updates.
--
-- The policy below lets a handyman update a job they've been assigned to.
-- It does not relax who owns the job (client_id) — only the client's own
-- policy governs inserts — and the WITH CHECK keeps handyman_id from being
-- reassigned to someone else.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Assigned handyman can update job" on public.jobs;

create policy "Assigned handyman can update job"
  on public.jobs for update
  to authenticated
  using (auth.uid() = handyman_id)
  with check (auth.uid() = handyman_id);
