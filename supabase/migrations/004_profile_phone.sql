-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add phone column to profiles
-- Run in Supabase SQL Editor
--
-- Stores a user-editable phone number for both clients and handymen.
-- Nullable so existing rows don't need a backfill. Edited via the new
-- shared EditProfileScreen. Existing "Users can update own profile" RLS
-- policy already covers writes.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists phone text;
