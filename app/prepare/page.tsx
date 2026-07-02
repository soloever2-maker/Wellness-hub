'use client'

// ── Pre-Class Ritual ───────────────────────────────────────────
// Opens from the 2h reminder notification and the home banner.
// Shows: next class card + prep checklist + a tip from Enjy's
// library + today's intention.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Droplets, Shirt, UtensilsCrossed,
  Sparkles, Loader2, Calendar, Check, Quote,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type NextSession = {
  id: string
  start_time: string
  end_time: string
  class_name: string
}

type Tip = { id: string; category: string; text: string }

const CLASS_EMOJI: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}

// Tips shown BEFORE class come from these categories
const PRE_CLASS_CATEGORIES = ['hydration', 'food', 'prep', 'breath', 'mindset']

const CHECKLIST = [
  { key: 'water', icon: Droplets, label: 'Sip water now', desc: 'Hydrate slowly — not all at once' },
  { key: 'mat', icon: Sparkles, label: 'Mat & towel packed', desc: 'Your grip will thank you' },
  { key: 'clothes', icon: Shirt, label: 'Comfy clothes on', desc: 'Move and breathe freely' },
  { key: 'food', icon: UtensilsCrossed, label: 'Light stomach', desc: 'Last meal ~2 hours before' },
]

const INTENTIONS = [
  'Today, return to your breath whenever it gets hard.',
  'Today, meet your body exactly where it is.',
  'Today, let go of one thing you\'ve been carrying.',
  'Today, practice patience — with the pose and with yourself.',
  'Today, notice the space between the breaths.',
  'Today, move with softness instead of force.',
  'Today, be curious instead of critical.',
]

// Small deterministic hash so the tip/intention stay the same all day
// for the same session (no reshuffling on every reload).
function seededIndex(seed: string, length: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h) % Math.max(length, 1)
}

function useCountdown(target?: string) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    if (!target) return
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) { setLabel('Starting now!'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      if (h >= 24) { const d = Math.floor(h / 24); setLabel(`In ${d}d ${h % 24}h`) }
      else if (h > 0) setLabel(`In ${h}h ${m}m`)
      else setLabel(`In ${m} min`)
    }
    calc()
    const iv = setInterval(calc, 30_000)
    return () => clearInterval(iv)
  }, [target])
  return label
}

export default function PreparePage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<NextSession | null>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const countdown = useCountdown(session?.start_time)

  // ── Load next booking + a tip ────────────────────────────────
  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const now = new Date().toISOString()

      const { data } = await supabase
        .from('bookings')
        .select('id, session:class_sessions(id, start_time, end_time, class_type:class_types(name))')
        .eq('client_id', user.id)
        .eq('status', 'confirmed')

      const upcoming = (data ?? [])
        .map((b: any) => b.session)
        .filter((s: any) => s?.start_time > now)
        .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))

      let sess: NextSession | null = null
      if (upcoming.length > 0) {
        const s = upcoming[0]
        sess = {
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          class_name: s.class_type?.name || 'Class',
        }
        setSession(sess)

        // Restore checklist for this session
        try {
          const saved = localStorage.getItem(`prep_${s.id}`)
          if (saved) setChecked(JSON.parse(saved))
        } catch { /* ignore */ }
      }

      // Fetch active pre-class tips and pick one (stable per session+day)
      const { data: tips } = await supabase
        .from('tips')
        .select('id, category, text')
        .eq('is_active', true)
        .in('category', PRE_CLASS_CATEGORIES)

      if (tips?.length) {
        const seed = `${sess?.id || 'general'}_${new Date().toDateString()}`
        setTip(tips[seededIndex(seed, tips.length)] as Tip)
      }

      setLoading(false)
    }
    run()
  }, [])

  const toggle = (key: string) => {
    if (!session) return
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    try { localStorage.setItem(`prep_${session.id}`, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const doneCount = CHECKLIST.filter(item => checked[item.key]).length
  const allDone = doneCount === CHECKLIST.length

  const intention = session
    ? INTENTIONS[seededIndex(`${session.id}_${new Date().toDateString()}`, INTENTIONS.length)]
    : INTENTIONS[seededIndex(new Date().toDateString(), INTENTIONS.length)]

  return (
    <main className="bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Get Ready ✨</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
        </div>
      ) : !session ? (
        /* No upcoming class */
        <div className="px-4 pt-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-[#006D77]/40" />
          </div>
          <p className="text-base font-semibold text-foreground">No upcoming class yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Book your next session and this space will help you get ready for it.
          </p>
          <Link href="/schedule"
            className="px-6 py-3 rounded-full bg-[#006D77] text-white text-sm font-semibold hover:bg-[#004E5C] transition-colors">
            View Schedule
          </Link>

          {tip && (
            <div className="mt-10 w-full bg-white border border-border rounded-2xl p-4 text-left shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="w-3.5 h-3.5 text-[#B8612A]" />
                <span className="text-xs font-semibold text-[#B8612A] uppercase tracking-wide">Tip from Enjy</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">

          {/* Class card */}
          <div className="bg-white border-2 border-[#006D77]/15 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#B8612A]" />
              <span className="text-xs font-semibold text-[#B8612A] uppercase tracking-wide">Your Class</span>
              <span className="flex-1" />
              <span className="text-xs font-bold text-[#006D77] bg-[#E0EEF0] px-2.5 py-0.5 rounded-full">
                {countdown}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{CLASS_EMOJI[session.class_name] || '🧘'}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground text-base">{session.class_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  {' · '}
                  {new Date(session.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Intention */}
          <div className="rounded-2xl p-4 text-white"
            style={{ background: 'linear-gradient(135deg, #005a63 0%, #003d44 100%)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
              Today&apos;s intention
            </p>
            <p className="text-sm leading-relaxed font-medium">{intention}</p>
          </div>

          {/* Checklist */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">Prep checklist</p>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${allDone ? 'bg-green-50 text-green-600' : 'bg-[#E0EEF0] text-[#006D77]'}`}>
                {allDone ? 'Ready! 🎉' : `${doneCount}/${CHECKLIST.length}`}
              </span>
            </div>
            <div className="space-y-2">
              {CHECKLIST.map(item => {
                const Icon = item.icon
                const isChecked = !!checked[item.key]
                return (
                  <button key={item.key} onClick={() => toggle(item.key)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 border transition-all text-left active:scale-[0.98] ${
                      isChecked
                        ? 'bg-[#E0EEF0]/60 border-[#006D77]/30'
                        : 'bg-white border-border hover:bg-[#EDD7C9]/10'
                    }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-[#006D77]' : 'bg-[#EDD7C9]/30'}`}>
                      {isChecked
                        ? <Check className="w-4 h-4 text-white" />
                        : <Icon className="w-4 h-4 text-[#006D77]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isChecked ? 'text-[#006D77]' : 'text-foreground'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tip from Enjy */}
          {tip && (
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="w-3.5 h-3.5 text-[#B8612A]" />
                <span className="text-xs font-semibold text-[#B8612A] uppercase tracking-wide">Tip from Enjy</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
            See you on the mat 🤍
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
