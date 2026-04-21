// Supabase Edge Function: push-dispatcher
//
// Invoked by a Database Webhook on INSERT into public.notifications. Reads
// the recipient's expo_push_token from profiles and sends a push via the
// Expo Push API. No auth headers needed on the outbound request — Expo
// identifies the project from the token itself.
//
// Deploy:
//   supabase functions deploy push-dispatcher --no-verify-jwt
//
// Env (set via dashboard → Edge Functions → push-dispatcher → Secrets):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  job_id: string | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: NotificationRow;
  schema: string;
  old_record: NotificationRow | null;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
    return new Response('Ignored', { status: 200 });
  }

  const row = payload.record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Respect the user's in-app preference and check for a registered device.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('expo_push_token, notif_push')
    .eq('id', row.user_id)
    .maybeSingle();

  if (profileError) {
    return new Response(`profile lookup: ${profileError.message}`, { status: 500 });
  }

  if (!profile?.expo_push_token || profile.notif_push === false) {
    return new Response('No token or push disabled', { status: 200 });
  }

  const message = {
    to: profile.expo_push_token,
    sound: 'default',
    title: row.title,
    body: row.body,
    data: { notificationId: row.id, jobId: row.job_id, type: row.type },
  };

  const expoRes = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(message),
  });

  const expoJson = await expoRes.json().catch(() => null);

  // Expo returns `status: "error"` with `details.error: "DeviceNotRegistered"`
  // when the token is stale. Clear it so we don't keep retrying.
  const ticket = (expoJson as any)?.data;
  if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
    await supabase
      .from('profiles')
      .update({ expo_push_token: null })
      .eq('id', row.user_id);
  }

  return new Response(JSON.stringify({ ok: expoRes.ok, ticket }), {
    status: expoRes.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
});
