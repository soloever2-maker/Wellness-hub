import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Reject an access request ───────────────────────────────────
// Rejection = full removal: the auth account AND the users row are
// deleted, so the phone number is completely freed and the person
// can register again later. (Admin-guarded, same pattern as
// /api/admin/reset-password.)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // ── 1) Verify the caller is an approved admin ──────────────
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

    // ── 2) Load the target user ────────────────────────────────
    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    const { data: target } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, role, status')
      .eq('id', user_id)
      .single()

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Safety rails: this endpoint only rejects PENDING, non-admin accounts.
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'Cannot reject an admin account' }, { status: 400 })
    }
    if (target.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be rejected. Use account deletion for active accounts.' },
        { status: 400 }
      )
    }

    // ── 3) Delete the auth account (frees the phone number) ────
    if (target.auth_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(target.auth_id)
      if (authDeleteError && !authDeleteError.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Failed to remove sign-in account: ' + authDeleteError.message },
          { status: 500 }
        )
      }
    }

    // ── 4) Delete any rows linked to them, then the users row ──
    // (a pending user rarely has data, but clean up just in case)
    const LINKED_TABLES = ['device_tokens', 'push_subscriptions', 'notification_log']
    for (const table of LINKED_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq('client_id', target.id)
      if (error) console.warn(`reject-user: skipped ${table}:`, error.message)
    }

    const { error: rowDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', target.id)

    if (rowDeleteError) {
      return NextResponse.json(
        { error: 'Sign-in removed but profile cleanup failed: ' + rowDeleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
