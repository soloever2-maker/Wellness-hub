// ── Server-side APNs sender (iOS native push) ─────────────────
// Zero extra npm dependencies: uses Node's built-in http2 + crypto.
// Works on Vercel's Node.js runtime (default for route handlers).
//
// Required env vars (add in Vercel → Project → Settings → Environment Variables):
//   APNS_TEAM_ID      → Apple Developer Team ID (10 chars, from developer.apple.com → Membership)
//   APNS_KEY_ID       → Key ID of the APNs Auth Key (.p8) you create in the portal
//   APNS_PRIVATE_KEY  → full contents of the .p8 file (BEGIN/END PRIVATE KEY included).
//                       If pasted as a single line, use \n for line breaks — handled below.
// Optional:
//   APNS_BUNDLE_ID    → defaults to com.alignwithenjy.app
//   APNS_SANDBOX      → 'true' only for local Xcode dev builds. TestFlight & App Store
//                       use the production APNs server (the default here).
//
// Until these vars are set, every function here safely no-ops (returns false / 0),
// so deploying this code BEFORE the Apple Developer account is ready is harmless —
// Web Push keeps working exactly as before.

import http2 from 'node:http2'
import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

const TEAM_ID = process.env.APNS_TEAM_ID
const KEY_ID = process.env.APNS_KEY_ID
const PRIVATE_KEY = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, '\n')
const BUNDLE_ID = process.env.APNS_BUNDLE_ID || 'com.alignwithenjy.app'
const APNS_HOST = process.env.APNS_SANDBOX === 'true'
  ? 'https://api.sandbox.push.apple.com'
  : 'https://api.push.apple.com'

export function apnsConfigured(): boolean {
  return !!(TEAM_ID && KEY_ID && PRIVATE_KEY)
}

// ── JWT (ES256) with caching ───────────────────────────────────
// Apple: reuse the token; don't mint more than 1 per 20 min, valid ≤ 1 hour.
let cachedJwt: { token: string; iat: number } | null = null

function getJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  if (cachedJwt && now - cachedJwt.iat < 50 * 60) return cachedJwt.token

  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const signingInput = `${b64url({ alg: 'ES256', kid: KEY_ID })}.${b64url({ iss: TEAM_ID, iat: now })}`
  const signature = crypto
    .sign('sha256', Buffer.from(signingInput), {
      key: crypto.createPrivateKey(PRIVATE_KEY!),
      dsaEncoding: 'ieee-p1363', // JWT needs raw r||s, not DER
    })
    .toString('base64url')

  cachedJwt = { token: `${signingInput}.${signature}`, iat: now }
  return cachedJwt.token
}

// ── Low-level: send one notification to one device token ──────
export interface ApnsMessage {
  title: string
  body: string
  data?: Record<string, any> // e.g. { type, url, sessionId, sound }
  sound?: string             // iOS notification sound, default 'default'
}

interface ApnsResult { ok: boolean; status: number; reason?: string }

function sendToToken(deviceToken: string, msg: ApnsMessage): Promise<ApnsResult> {
  return new Promise(resolve => {
    const client = http2.connect(APNS_HOST)
    const done = (r: ApnsResult) => { try { client.close() } catch {} ; resolve(r) }

    client.on('error', () => done({ ok: false, status: 0, reason: 'connect_error' }))
    client.setTimeout(10000, () => done({ ok: false, status: 0, reason: 'timeout' }))

    let req
    try {
      req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'authorization': `bearer ${getJwt()}`,
        'apns-topic': BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
      })
    } catch {
      return done({ ok: false, status: 0, reason: 'request_error' })
    }

    let status = 0
    let body = ''
    req.on('response', headers => { status = Number(headers[':status'] || 0) })
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      let reason: string | undefined
      try { reason = JSON.parse(body).reason } catch {}
      done({ ok: status === 200, status, reason })
    })
    req.on('error', () => done({ ok: false, status: 0, reason: 'stream_error' }))

    req.end(JSON.stringify({
      aps: {
        alert: { title: msg.title, body: msg.body },
        sound: msg.sound || 'default',
      },
      ...(msg.data || {}),
    }))
  })
}

// Token is dead → remove it from the DB so we stop retrying.
function isDeadToken(r: ApnsResult): boolean {
  return r.status === 410 ||
    r.reason === 'BadDeviceToken' ||
    r.reason === 'Unregistered' ||
    r.reason === 'DeviceTokenNotForTopic'
}

// ── High-level helpers used by the API routes ──────────────────

/** Send to every iOS device registered for one client. Returns true if at least one succeeded. */
export async function sendApnsToClient(
  supabase: SupabaseClient,
  clientId: string,
  msg: ApnsMessage
): Promise<boolean> {
  if (!apnsConfigured()) return false

  const { data: rows } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('client_id', clientId)

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

/** Broadcast to all iOS devices of the given clients. Returns { sent, total }. */
export async function sendApnsBroadcast(
  supabase: SupabaseClient,
  clientIds: string[],
  msg: ApnsMessage
): Promise<{ sent: number; total: number; errors: string[] }> {
  if (!apnsConfigured() || !clientIds?.length) return { sent: 0, total: 0, errors: [] }

  const { data: rows } = await supabase
    .from('device_tokens')
    .select('client_id, token')
    .in('client_id', clientIds)

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
      errors.push(`apns:${result.reason || result.status}`)
    }
  }
  return { sent, total: rows.length, errors }
}
