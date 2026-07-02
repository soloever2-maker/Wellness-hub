import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client — Service Role key (server-only). Required by Apple
// App Store Guideline 5.1.1(v): users must be able to delete their
// account (and its data) from inside the app.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tables that hold rows linked to the client via `client_id`.
// Deletes are best-effort: a missing table or FK quirk must not
// block the rest of the wipe.
const CLIENT_LINKED_TABLES = [
  'device_tokens',
  'push_subscriptions',
  'waitlist',
  'bookings',
  'client_packages',
  'retreat_interests',
  'private_session_requests',
  'notification_log',
]

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

    const authId = callerAuth.user.id

    // ── 2) Load the caller's profile row ────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_id', authId)
      .single()

    if (profileError || !profile) {
      // No profile row — still remove the auth account so login dies.
      await supabaseAdmin.auth.admin.deleteUser(authId)
      return NextResponse.json({ success: true })
    }

    // Safety: don't let the last admin nuke themselves from the app.
    if (profile.role === 'admin') {
      const { count } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('status', 'approved')
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'The last admin account cannot be deleted.' },
          { status: 400 }
        )
      }
    }

    const clientId = profile.id

    // ── 3) Wipe rows linked to this client (best-effort) ────────
    for (const table of CLIENT_LINKED_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq('client_id', clientId)
      if (error) console.warn(`delete-account: skipped ${table}:`, error.message)
    }

    // ── 4) Remove the users row; if FKs block it (e.g. payments
    //       kept for business records), anonymize it instead ─────
    const { error: hardDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', clientId)

    if (hardDeleteError) {
      const { error: anonError } = await supabaseAdmin
        .from('users')
        .update({
          full_name: 'Deleted Account',
          phone: `deleted_${clientId}`,
          avatar_url: null,
          auth_id: null,
          status: 'deleted',
        })
        .eq('id', clientId)
      if (anonError) {
        console.error('delete-account: anonymize failed:', anonError.message)
        return NextResponse.json(
          { error: 'Could not delete account data. Please contact support.' },
          { status: 500 }
        )
      }
    }

    // ── 5) Delete the auth user — kills the login permanently ───
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authId)
    if (authDeleteError) {
      console.error('delete-account: auth delete failed:', authDeleteError.message)
      return NextResponse.json(
        { error: 'Account data removed, but sign-in removal failed. Contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('delete-account: unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
