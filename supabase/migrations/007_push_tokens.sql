-- Store each device's Expo push token on the user's profile. The Edge
-- Function `push-dispatcher` reads this column when fanning out a newly
-- inserted notification row to the Expo push API.
--
-- Run this in the Supabase SQL editor.
--
-- After running, wire the Database Webhook in the dashboard:
--   Database → Webhooks → Create a new hook
--     Table:     public.notifications
--     Events:    INSERT
--     Type:      HTTP Request → Supabase Edge Functions → push-dispatcher
--     Method:    POST
--     Headers:   Authorization: Bearer <your anon key>
-- The Edge Function reads the webhook's `record` payload and sends the push.

alter table public.profiles
  add column if not exists expo_push_token text;

-- Only the owner reads/writes their token (existing RLS on profiles already
-- covers this; no new policy needed unless you've tightened column grants).
