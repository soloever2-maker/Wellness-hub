import { GoogleAuth } from 'google-auth-library'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Firebase Cloud Messaging (Android) ─────────────────────────
// Mirrors lib/apns.ts, but for Android device tokens (platform='android').
// Uses FCM HTTP v1 API, authenticated with the service-account JSON stored
// (base64) in the FCM_SERVICE_ACCOUNT env var.

const RAW_SA = process.env.FCM_SERVICE_ACCOUNT || ''

function loadServiceAccount(): { project_id: string; client_email: string; private_key: string } | null {
  if (!RAW_SA) return null
  try {
    // Accept either raw JSON or base64-encoded JSON.
    const text = RAW_SA.trim().startsWith('{')
      ? RAW_SA
      : Buffer.from(RAW_SA, 'base64').toString('utf8')
    const sa = JSON.parse(text)
    if (sa.project_id && sa.client_email && sa.private_key) return sa
    return null
  } catch {
    return null
  }
}

const SERVICE_ACCOUNT = loadServiceAccount()

export function fcmConfigured(): boolean {
  return !!SERVICE_ACCOUNT
}

// ── OAuth access token (cached ~55 min) ────────────────────────
let cachedToken: { token: string; exp: number } | null = null

async function getAccessToken(): Promise<string | null> {
  if (!SERVICE_ACCOUNT) return null
  const now = Date.now()
  if (cachedToken && now < cachedToken.exp) return cachedToken.token

  const auth = new GoogleAuth({
    credentials: {
      client_email: SERVICE_ACCOUNT.client_email,
      private_key: SERVICE_ACCOUNT.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) return null

  cachedToken = { token, exp: now + 55 * 60 * 1000 }
  return token
}

// ── Types (match apns.ts) ──────────────────────────────────────
export interface FcmMessage {
  title: string
  body: string
  data?: Record<string, any> // e.g. { type, url }
}

export interface FcmResult { ok: boolean; status: number; reason?: string }

// ── Low-level: send one notification to one device token ───────
export async function sendToToken(deviceToken: string, msg: FcmMessage): Promise<FcmResult> {
  if (!SERVICE_ACCOUNT) return { ok: false, status: 0, reason: 'not_configured' }

  const accessToken = await getAccessToken()
  if (!accessToken) return { ok: false, status: 0, reason: 'auth_failed' }

  // FCM data values must all be strings.
  const dataStrings: Record<string, string> = {}
  for (const [k, v] of Object.entries(msg.data || {})) {
    dataStrings[k] = typeof v === 'string' ? v : JSON.stringify(v)
  }

  const url = `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`
  const payload = {
    message: {
      token: deviceToken,
      notification: { title: msg.title, body: msg.body },
      data: dataStrings,
      android: {
        priority: 'HIGH',
        notification: { sound: 'default', default_sound: true },
      },
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) return { ok: true, status: res.status }

    let reason: string | undefined
    try {
      const errBody = await res.json()
      reason = errBody?.error?.status || errBody?.error?.message
    } catch {}
    return { ok: false, status: res.status, reason }
  } catch (err: any) {
    return { ok: false, status: 0, reason: err?.message || 'fetch_error' }
  }
}

// A token is dead when FCM says it's unregistered / invalid.
function isDeadToken(r: FcmResult): boolean {
  return (
    r.status === 404 ||
    r.reason === 'UNREGISTERED' ||
    r.reason === 'NOT_FOUND' ||
    r.reason === 'INVALID_ARGUMENT'
  )
}

// ── High-level helpers (match apns.ts signatures) ──────────────

/** Send to every Android device registered for one client. Returns true if at least one succeeded. */
export async function sendFcmToClient(
  supabase: SupabaseClient,
  clientId: string,
  msg: FcmMessage
): Promise<boolean> {
  if (!fcmConfigured()) return false

  const { data: rows } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('client_id', clientId)
    .eq('platform', 'android')

  if (!rows?.length) return false

  let sent = false
  for (const row of rows) {
    const result = await sendToToken(row.token, msg)
    if (result.ok) sent = true
    else if (isDeadToken(result)) {
      await supabase.from('device_tokens').delete().eq('token', row.token)
    }
  }
  return sent
}

/** Broadcast to all Android devices of the given clients. Returns { sent, total, errors }. */
export async function sendFcmBroadcast(
  supabase: SupabaseClient,
  clientIds: string[],
  msg: FcmMessage
): Promise<{ sent: number; total: number; errors: string[] }> {
  if (!fcmConfigured() || !clientIds?.length) return { sent: 0, total: 0, errors: [] }

  const { data: rows } = await supabase
    .from('device_tokens')
    .select('client_id, token')
    .in('client_id', clientIds)
    .eq('platform', 'android')

  if (!rows?.length) return { sent: 0, total: 0, errors: [] }

  let sent = 0
  const errors: string[] = []
  for (const row of rows) {
    const result = await sendToToken(row.token, msg)
    if (result.ok) sent++
    else {
      if (isDeadToken(result)) {
        await supabase.from('device_tokens').delete().eq('token', row.token)
      }
      errors.push(`fcm:${result.reason || result.status}`)
    }
  }
  return { sent, total: rows.length, errors }
}
