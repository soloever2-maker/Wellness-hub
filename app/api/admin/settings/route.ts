import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Admin: save a setting ──────────────────────────────────────
// Settings writes go through the server (service role) so they
// never depend on client-side RLS, and errors are surfaced.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_KEYS = ['cancellation_window_hours', 'max_freeze_days', 'reminder_timing']

export async function POST(request: Request) {
  try {
    // Verify the caller is an approved admin
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })

    const { data: callerAuth, error: callerError } = await supabaseAdmin.auth.getUser(token)
    if (callerError || !callerAuth.user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const { data: caller } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('auth_id', callerAuth.user.id)
      .single()

    if (!caller || caller.role !== 'admin' || caller.status !== 'approved') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { key, value } = await request.json()
    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 })
    }
    if (value === undefined || value === null || String(value).trim() === '') {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 })
    }

    // Update-then-insert (works with or without a unique constraint)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('settings')
      .update({ value: String(value).trim() })
      .eq('key', key)
      .select('key')

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    if (!updated?.length) {
      const { error: insertError } = await supabaseAdmin
        .from('settings')
        .insert({ key, value: String(value).trim() })
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
