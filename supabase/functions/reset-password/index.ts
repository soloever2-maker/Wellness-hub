// ============================================================
// NEW FILE — save at:
//   supabase/functions/reset-password/index.ts
// Deploy with:
//   supabase functions deploy reset-password --no-verify-jwt
//
// Self-service password reset:
// verifies phone + date of birth + client ID, then updates the
// auth password using the service role (never exposed to client).
// Rate limited: 5 failed attempts per phone per hour.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Same normalization as lib/auth.ts on the frontend
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('20') && digits.length >= 12) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `+20${digits.slice(1)}`
  if (digits.length === 10) return `+20${digits}`
  return `+20${digits}`
}

const MAX_FAILED_ATTEMPTS = 5
const WINDOW_MINUTES = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  let body: {
    phone?: string
    date_of_birth?: string
    client_id?: number | string
    new_password?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'INVALID_BODY' }, 400)
  }

  const { phone, date_of_birth, client_id, new_password } = body

  if (!phone || !date_of_birth || !client_id || !new_password) {
    return json({ error: 'MISSING_FIELDS' }, 400)
  }
  if (typeof new_password !== 'string' || new_password.length < 6) {
    return json({ error: 'PASSWORD_TOO_SHORT' }, 400)
  }

  const normalizedPhone = normalizePhone(String(phone))
  const clientIdNum = parseInt(String(client_id), 10)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── 1. Rate limit: 5 failed attempts / phone / hour ─────────
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count: failedCount } = await admin
    .from('password_reset_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('phone', normalizedPhone)
    .eq('success', false)
    .gte('created_at', windowStart)

  if ((failedCount ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return json({ error: 'RATE_LIMITED' }, 429)
  }

  const logAttempt = async (success: boolean) => {
    await admin.from('password_reset_attempts').insert({ phone: normalizedPhone, success })
  }

  // ── 2. Look up the user ──────────────────────────────────────
  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, auth_id, phone, date_of_birth, client_id, status')
    .eq('phone', normalizedPhone)
    .maybeSingle()

  if (userError || !user) {
    await logAttempt(false)
    // Generic message — never reveal whether the phone exists
    return json({ error: 'MISMATCH' }, 400)
  }

  // ── 3. DOB must exist to use self-service reset ──────────────
  if (!user.date_of_birth) {
    // Not logged as a failed attempt — it's not a guessing attack
    return json({ error: 'DOB_MISSING' }, 400)
  }

  // ── 4. Verify identity: DOB + client ID must both match ─────
  const dobMatches = String(user.date_of_birth).slice(0, 10) === String(date_of_birth).slice(0, 10)
  const clientIdMatches = Number(user.client_id) === clientIdNum && clientIdNum > 0

  if (!dobMatches || !clientIdMatches) {
    await logAttempt(false)
    return json({ error: 'MISMATCH' }, 400)
  }

  if (!user.auth_id) {
    await logAttempt(false)
    return json({ error: 'NO_ACCOUNT' }, 400)
  }

  // ── 5. Update the password with the service role ────────────
  const { error: updateError } = await admin.auth.admin.updateUserById(user.auth_id, {
    password: new_password,
  })

  if (updateError) {
    await logAttempt(false)
    return json({ error: 'UPDATE_FAILED' }, 500)
  }

  await logAttempt(true)
  return json({ ok: true })
})
