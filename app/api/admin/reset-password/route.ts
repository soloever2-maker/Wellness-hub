import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client — uses the Service Role key (server-only) so it can change
// any user's password directly. Never expose this key to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // ── 1) Identify the caller from their access token ─────────
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const { data: callerAuth, error: callerError } = await supabaseAdmin.auth.getUser(token)
    if (callerError || !callerAuth.user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // ── 2) Confirm the caller is an approved admin ──────────────
    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('auth_id', callerAuth.user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'approved') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // ── 3) Validate input ────────────────────────────────────────
    const { client_auth_id, new_password } = await request.json()

    if (!client_auth_id || !new_password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (typeof new_password !== 'string' || new_password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // ── 4) Reset the target user's password ─────────────────────
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      client_auth_id,
      { password: new_password }
    )

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
