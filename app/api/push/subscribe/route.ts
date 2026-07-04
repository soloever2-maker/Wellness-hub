import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Save push subscription
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint, p256dh, auth, client_id } = body

    if (!endpoint || !client_id) {
      return NextResponse.json({ error: 'Missing endpoint or client_id' }, { status: 400 })
    }

    // "The browser belongs to its last resident": a browser endpoint can
    // only be owned by ONE account. Detach it from anyone else first, so
    // shared devices never receive another account's notifications.
    await supabase.from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .neq('client_id', client_id)

    await supabase.from('push_subscriptions').upsert({
      client_id,
      endpoint,
      p256dh,
      auth,
    }, { onConflict: 'client_id,endpoint' })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Remove push subscription
export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json()
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
