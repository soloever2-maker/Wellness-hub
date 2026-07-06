// ============================================================
// NEW FILE — save at:
//   components/dob-gate.tsx
// Blocking gate: approved clients without a date of birth must
// add it before using the app. Powers self-service password
// reset (identity verification).
// ============================================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarDays, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const SKIP_ROUTES = ['/login', '/privacy']

export function DobGate() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [dob, setDob] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Ask the DB once per session, then trust the cache
  const checkedAuthId = useRef<string | null>(null)

  const check = useCallback(async () => {
    if (SKIP_ROUTES.includes(pathname) || pathname.startsWith('/admin') || pathname.startsWith('/select-role')) {
      setShow(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      checkedAuthId.current = null
      setShow(false)
      return
    }

    // Already verified this session — nothing to do
    if (checkedAuthId.current === session.user.id) return

    const { data: user } = await supabase
      .from('users')
      .select('id, role, status, date_of_birth')
      .eq('auth_id', session.user.id)
      .maybeSingle()

    if (!user || user.role !== 'client' || user.status !== 'approved') {
      checkedAuthId.current = session.user.id
      setShow(false)
      return
    }

    if (!user.date_of_birth) {
      setShow(true)
    } else {
      checkedAuthId.current = session.user.id
      setShow(false)
    }
  }, [pathname])

  useEffect(() => {
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') check()
      if (event === 'SIGNED_OUT') {
        checkedAuthId.current = null
        setShow(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [check])

  const handleSave = async () => {
    setError('')

    if (!dob) {
      setError('Please select your date of birth.')
      return
    }

    const date = new Date(dob + 'T00:00:00')
    const now = new Date()
    const age = (now.getTime() - date.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (isNaN(date.getTime()) || age < 10 || age > 100) {
      setError('Please enter a valid date of birth.')
      return
    }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const { error: updateError } = await supabase
      .from('users')
      .update({ date_of_birth: dob })
      .eq('auth_id', session.user.id)

    setSaving(false)

    if (updateError) {
      setError('Could not save. Please try again.')
      return
    }

    checkedAuthId.current = session.user.id
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-[#006D77]" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground text-center mb-2">One quick thing!</h3>
        <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
          Please add your date of birth. We use it to verify your identity if you ever need to reset your password.
        </p>

        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth</label>
          <input
            type="date"
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => { setDob(e.target.value); setError('') }}
            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
          />
        </div>

        {dob && !error && (
          <p className="text-xs text-muted-foreground text-center mb-4">
            Confirming:{' '}
            <span className="font-semibold text-foreground">
              {new Date(dob + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !dob}
          className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">Only visible to you and the studio</p>
        </div>
      </div>
    </div>
  )
}
