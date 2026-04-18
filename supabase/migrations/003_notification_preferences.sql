-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add notification preference columns to profiles
-- Run in Supabase SQL Editor
--
-- Adds three boolean flags powering the toggles on the client SettingsScreen.
-- Defaults mirror the visual defaults in the design: push + SMS on, email
-- marketing off. Existing rows inherit the defaults via `default <value>`.
-- The existing "Users can update own profile" RLS policy already covers
-- writes — no policy changes required.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists notif_push             boolean not null default true,
  add column if not exists notif_email_marketing  boolean not null default false,
  add column if not exists notif_sms              boolean not null default true;
