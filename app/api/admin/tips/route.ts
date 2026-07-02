import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Admin Tips API ─────────────────────────────────────────────
// The `tips` table has RLS: clients can only READ active tips.
// All writes go through here with the Service Role key, after
// verifying the caller is an approved admin (same pattern as
// /api/admin/reset-password).

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CATEGORIES = ['hydration', 'food', 'prep', 'breath', 'practice', 'recovery', 'mindset']

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return { error: 'Missing auth token', status: 401 }

  const { data: callerAuth, error: callerError } = await supabaseAdmin.auth.getUser(token)
  if (callerError || !callerAuth.user) return { error: 'Invalid or expired session', status: 401 }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, status')
    .eq('auth_id', callerAuth.user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
    return { error: 'Not authorized', status: 403 }
  }
  return { error: null, status: 200 }
}

// List ALL tips (including inactive) — admin view
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await supabaseAdmin
    .from('tips')
    .select('id, category, text, is_active, sort_order, created_at')
    .order('category')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tips: data })
}

// Create a tip
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { category, text } = await request.json()
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Tip text is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert({ category, text: text.trim() })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Update a tip (text / category / is_active)
export async function PUT(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { id, category, text, is_active } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const updates: Record<string, any> = {}
    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      updates.category = category
    }
    if (text !== undefined) {
      if (!text?.trim()) return NextResponse.json({ error: 'Tip text is required' }, { status: 400 })
      updates.text = text.trim()
    }
    if (is_active !== undefined) updates.is_active = !!is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('tips').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Delete a tip
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabaseAdmin.from('tips').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
