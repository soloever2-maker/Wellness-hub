'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Clock, Users, Calendar, CheckCircle, Package, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { playSingingBowl } from '@/lib/sounds'

type Session = {
  id: string
  start_time: string
  duration_minutes: number
  capacity: number
  instructor_name: string
  class_type: { name: string; description: string; color: string }
}

type ClientPackage = {
  id: string
  sessions_remaining: number
  expiry_date: string
  package: { name: string }
}

type BookingStatus = 'idle' | 'loading' | 'success' | 'already_booked' | 'no_package' | 'full' | 'error'

function ClassPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')

  const [session, setSession] = useState<Session | null>(null)
  const [spotsLeft, setSpotsLeft] = useState(0)
  const [myPackages, setMyPackages] = useState<ClientPackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [status, setStatus] = useState<BookingStatus>('idle')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    if (!sessionId) { router.replace('/schedule'); return }

    const fetchAll = async () => {
      const user = await getCurrentUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      // Fetch session details
      const { data: s } = await supabase
        .from('class_sessions')
        .select('*, class_type:class_types(name, description, color)')
        .eq('id', sessionId)
        .single()

      if (!s) { router.replace('/schedule'); return }
      setSession(s as unknown as Session)

      // Count confirmed bookings
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId)
        .eq('status', 'confirmed')

      setSpotsLeft(s.capacity - (count || 0))

      // Check if already booked
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('session_id', sessionId)
        .eq('client_id', user.id)
        .eq('status', 'confirmed')
        .maybeSingle()

      if (existing) { setStatus('already_booked'); setLoading(false); return }

      // Get active packages
      const { data: pkgs } = await supabase
        .from('client_packages')
        .select('id, sessions_remaining, expiry_date, package:packages(name)')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .gt('sessions_remaining', 0)
        .gte('expiry_date', new Date().toISOString())
        .order('expiry_date')

      if (pkgs?.length) {
        setMyPackages(pkgs as unknown as ClientPackage[])
        setSelectedPackageId(pkgs[0].id)
      }

      setLoading(false)
    }
    fetchAll()
  }, [sessionId, router])

  const handleBook = async () => {
    if (!session || !selectedPackageId || !userId) return
    setStatus('loading')
    try {
      // Insert booking
      const { error: bookErr } = await supabase.from('bookings').insert({
        session_id: session.id,
        client_id: userId,
        client_package_id: selectedPackageId,
        status: 'confirmed',
      })
      if (bookErr) throw bookErr

      // Decrement sessions_remaining
      const pkg = myPackages.find(p => p.id === selectedPackageId)
      if (pkg) {
        await supabase
          .from('client_packages')
          .update({ sessions_remaining: pkg.sessions_remaining - 1 })
          .eq('id', selectedPackageId)
      }

      playSingingBowl(0.5)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
    </div>
  )

  if (!session) return null

  const startTime = new Date(session.start_time)
  const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const className = (session.class_type as any)?.name || 'Class'
  const description = (session.class_type as any)?.description || ''
  const isFull = spotsLeft <= 0

  const classEmoji: Record<string, string> = {
    'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga': '🧘',
    'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
  }

  return (
    <main className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#006D77] to-[#004E5C] px-4 pt-12 pb-8 text-white relative">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-4xl mb-3">{classEmoji[className] || '🧘'}</div>
        <h1 className="text-2xl font-bold mb-1">{className}</h1>
        <p className="text-white/70 text-sm">with {session.instructor_name || 'Enjy Gebril'}</p>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Date / Time / Spots */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {[
            { icon: Calendar, label: 'Date', value: dateStr },
            { icon: Clock, label: 'Time', value: `${timeStr} · ${session.duration_minutes} min` },
            { icon: Users, label: 'Spots', value: isFull ? 'Class is full' : `${spotsLeft} of ${session.capacity} available` },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? 'border-b border-border' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-[#E0EEF0] flex items-center justify-center">
                <item.icon className="w-4 h-4 text-[#006D77]" />
              </div>
              <span className="text-xs text-muted-foreground w-12">{item.label}</span>
              <span className={`text-sm font-medium flex-1 ${item.label === 'Spots' && isFull ? 'text-red-500' : 'text-foreground'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        {description && (
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-2">About this class</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        )}

        {/* Package Selector — only show if has packages and not booked */}
        {status === 'idle' && !isFull && myPackages.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#006D77]" />
              Use Package
            </h3>
            <div className="space-y-2">
              {myPackages.map(pkg => (
                <button key={pkg.id} onClick={() => setSelectedPackageId(pkg.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    selectedPackageId === pkg.id
                      ? 'border-[#006D77] bg-[#006D77]/5'
                      : 'border-border bg-white'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{(pkg.package as any)?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pkg.sessions_remaining} sessions left · expires {new Date(pkg.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPackageId === pkg.id ? 'border-[#006D77] bg-[#006D77]' : 'border-border'
                  }`}>
                    {selectedPackageId === pkg.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4 pb-safe">

        {/* Already booked */}
        {status === 'already_booked' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[#4CAF50]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">You&apos;re booked for this class!</span>
            </div>
            <Link href="/bookings" className="w-full py-3 border border-[#006D77] text-[#006D77] font-semibold rounded-xl text-center">
              View My Bookings
            </Link>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[#4CAF50]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold">Booking confirmed! 🎉</span>
            </div>
            <Link href="/bookings" className="w-full py-3 bg-[#006D77] text-white font-semibold rounded-xl text-center">
              View My Bookings
            </Link>
          </div>
        )}

        {/* No package */}
        {status === 'idle' && !isFull && myPackages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#E86500] justify-center">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">You need a package to book</span>
            </div>
            <Link href="/packages" className="block w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl text-center">
              Browse Packages
            </Link>
          </div>
        )}

        {/* Full */}
        {isFull && status !== 'already_booked' && status !== 'success' && (
          <button className="w-full py-3.5 border-2 border-[#E86500] text-[#E86500] font-semibold rounded-xl">
            Join Waitlist
          </button>
        )}

        {/* Book Now */}
        {status === 'idle' && !isFull && myPackages.length > 0 && (
          <button onClick={handleBook} disabled={!selectedPackageId}
            className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#006D77]/20">
            Confirm Booking
          </button>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
            <span className="text-sm text-muted-foreground">Booking your spot...</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-center text-sm text-red-500">Something went wrong. Try again.</p>
            <button onClick={() => setStatus('idle')}
              className="w-full py-3 border border-border rounded-xl text-sm font-medium">
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ClassPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
      </div>
    }>
      <ClassPageInner />
    </Suspense>
  )
}
