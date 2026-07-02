import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Register / unregister a native device token (APNs) ────────
// Mirrors /api/push/subscribe but for the iOS shell.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Save device token
export async function POST(request: Request) {
  try {
    const { token, client_id, platform = 'ios' } = await request.json()

    if (!token || !client_id) {
      return NextResponse.json({ error: 'Missing token or client_id' }, { status: 400 })
    }

    // A device token can move between accounts (logout → login as someone
    // else on the same phone), so first detach it from any other client.
    await supabase.from('device_tokens').delete().eq('token', token).neq('client_id', client_id)

    await supabase.from('device_tokens').upsert(
      { client_id, token, platform },
      { onConflict: 'client_id,token' }
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Remove device token
export async function DELETE(request: Request) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }
    await supabase.from('device_tokens').delete().eq('token', token)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
