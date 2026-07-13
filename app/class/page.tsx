'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { ArrowLeft, Clock, Users, Calendar, CheckCircle, Package, AlertCircle, Loader2, Info, Volume2, VolumeX, Share2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { playSingingBowl } from '@/lib/sounds'
import { startAmbientTrack, stopAmbientTrack, isAmbientPlaying } from '@/lib/ambient-tracks'

type Session = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked_count: number
  instructor_name: string
  class_type: { name: string; description: string; image_url: string | null }
}

type ClientPackage = {
  id: string
  sessions_remaining: number
  expiry_date: string
  package: { name: string }
}

type BookingStatus = 'idle' | 'loading' | 'success' | 'already_booked' | 'no_package' | 'full' | 'error' | 'waitlisted'

const CLASS_IMAGES: Record<string, string> = {
  'Power Yoga':             '/images/classes/yoga.jpg',
  'Mat Pilates':            '/images/classes/stretching.jpg',
  'Gentle Yoga & Recovery': '/images/classes/meditation.jpg',
  'Belly Rhythmic Dancing': '/images/classes/sidebend.jpg',
  'Aqua Aerobics':          '/images/venue/outdoor.jpg',
}
const FALLBACK_IMG = '/images/classes/yoga.jpg'

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
  const [isPast, setIsPast] = useState(false)
  const [cancelWindowHours, setCancelWindowHours] = useState(12)
  const [ambientOn, setAmbientOn] = useState(false)

  // نحفظ الـ sessionId عند الـ mount بس
  // عشان لو الـ URL اتغير من برا (BackHandler مثلاً) الـ effect ما يـredirect-ش
  const mountedSessionId = useRef(sessionId)

  useEffect(() => {
    const id = mountedSessionId.current
    if (!id) { router.replace('/schedule'); return }

    const fetchAll = async () => {
      const user = await getCurrentUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const { data: s } = await supabase
        .from('class_sessions')
        .select('id, start_time, end_time, max_capacity, booked_count, instructor_name, class_type:class_types(name, description, image_url)')
        .eq('id', id)
        .single()

      if (!s) { router.replace('/schedule'); return }
      setSession(s as unknown as Session)
      setSpotsLeft(s.max_capacity - s.booked_count)

      // Load cancellation window (admin-configurable, fallback 12h)
      supabase.from('settings').select('value').eq('key', 'cancellation_window_hours').maybeSingle()
        .then(({ data: setting }) => {
          const h = parseFloat(setting?.value)
          if (!isNaN(h) && h > 0) setCancelWindowHours(h)
        })

      // ⛔ Class already started/finished → booking is closed. Full stop.
      if (new Date(s.start_time).getTime() <= Date.now()) {
        setIsPast(true)
        setLoading(false)
        return
      }

      // Already booked? (any non-cancelled state blocks a new booking for this session)
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('session_id', id)
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'pending', 'attended', 'no_show'])
        .maybeSingle()

      if (existing) { setStatus('already_booked'); setLoading(false); return }

      // Active packages
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally on mount only — sessionId won't change while on page

  // ── Ambient track: play when session loads, stop on leave ──
  useEffect(() => {
    if (!session) return
    const className = (session.class_type as any)?.name || ''
    // Check if user previously muted — respect their preference
    const muted = localStorage.getItem('ambient_muted') === '1'
    if (!muted && className) {
      startAmbientTrack(className, 0.4)
      setAmbientOn(true)
    }
    return () => { stopAmbientTrack(); setAmbientOn(false) }
  }, [session])

  const toggleAmbient = () => {
    if (ambientOn) {
      stopAmbientTrack()
      setAmbientOn(false)
      localStorage.setItem('ambient_muted', '1')
    } else {
      const className = (session?.class_type as any)?.name || ''
      startAmbientTrack(className, 0.4)
      setAmbientOn(true)
      localStorage.removeItem('ambient_muted')
    }
  }

  const handleBook = async () => {
    if (!session || !selectedPackageId || !userId) return
    // Revalidate at click time — the user may have left the page open
    if (new Date(session.start_time).getTime() <= Date.now()) { setIsPast(true); return }
    setStatus('loading')
    try {
      const { error } = await supabase.from('bookings').insert({
        session_id: session.id,
        client_id: userId,
        client_package_id: selectedPackageId,
        status: 'confirmed',
      })
      if (error) throw error

      // Update booked_count + decrement sessions_remaining
      await supabase.from('class_sessions')
        .update({ booked_count: session.booked_count + 1 })
        .eq('id', session.id)

      const pkg = myPackages.find(p => p.id === selectedPackageId)
      if (pkg) {
        const newRemaining = pkg.sessions_remaining - 1
        await supabase.from('client_packages')
          .update({ sessions_remaining: newRemaining })
          .eq('id', selectedPackageId)

        // Low balance notification — last session remaining
        if (newRemaining === 1) {
          fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: userId,
              title: '⚠️ Last Session!',
              body: 'You have 1 session left in your package. Tap to renew before it runs out!',
              type: 'low_balance',
            }),
          }).catch(() => {})
        }
      }

      playSingingBowl(0.5)
      setStatus('success')

      // Notify Enjy about the new booking (best-effort)
      supabase.auth.getSession().then(({ data: { session: authSession } }) => {
        if (authSession?.access_token) {
          fetch("/api/push/notify-admins", {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authSession.access_token}`,
            },
            body: JSON.stringify({
              kind: "booking",
              class_name: (session!.class_type as any)?.name || null,
              class_date:
                new Date(session!.start_time).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                }) + " at " +
                new Date(session!.start_time).toLocaleTimeString("en-US", {
                  hour: "numeric", minute: "2-digit", hour12: true,
                }),
            }),
          }).catch(() => {})
        }
      }).catch(() => {})
    } catch {
      setStatus('error')
    }
  }

  const handleJoinWaitlist = async () => {
    if (!session || !userId) return
    if (new Date(session.start_time).getTime() <= Date.now()) { setIsPast(true); return }
    setStatus('loading')
    try {
      await supabase.from('waitlist').insert({
        session_id: session.id,
        client_id: userId,
        status: 'waiting',
      })
      setStatus('waitlisted')
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
  const endTime = new Date(session.end_time)
  const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const className = (session.class_type as any)?.name || 'Class'
  const description = (session.class_type as any)?.description || ''
  const instructorName = session.instructor_name || 'Enjy Gebril'
  const imageSrc = (session.class_type as any)?.image_url || CLASS_IMAGES[className] || FALLBACK_IMG
  const isFull = spotsLeft <= 0
  // Share class with friends
  const handleShare = async () => {
    const shareText = `Join me for ${className} with ${instructorName}! 🧘‍♀️\n📅 ${dateStr}\n🕐 ${timeStr}\n\nBook your spot:`
    const shareUrl = `${window.location.origin}/class?id=${session.id}`

    if (navigator.share) {
      try {
        await navigator.share({ title: `${className} — Align with Enjy`, text: shareText, url: shareUrl })
      } catch { /* user cancelled — silent */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        alert('Link copied! Share it with your friends 🤍')
      } catch { /* silent */ }
    }
  }

  const cancelDeadline = new Date(startTime.getTime() - cancelWindowHours * 3_600_000)
  const cancelDeadlineStr = `${cancelDeadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${cancelDeadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`

  return (
    <main className="bg-background min-h-screen pb-32">
      {/* Hero Image Header */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={className}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10" />
        <button onClick={() => router.push('/schedule')}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        {/* Top-right action buttons */}
        <div className="absolute top-12 right-4 flex items-center gap-2">
          <button onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Share this class"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <button onClick={toggleAmbient}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            aria-label={ambientOn ? 'Mute ambient sound' : 'Play ambient sound'}
          >
            {ambientOn
              ? <Volume2 className="w-5 h-5 text-white" />
              : <VolumeX className="w-5 h-5 text-white/60" />
            }
          </button>
        </div>
        <div className="absolute bottom-4 left-4">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">{className}</h1>
          <p className="text-white/80 text-sm mt-0.5">with {instructorName}</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {[
            { icon: Calendar, label: 'Date',  value: dateStr },
            { icon: Clock,    label: 'Time',  value: timeStr },
            { icon: Users,    label: 'Spots', value: isFull ? 'Class is full' : `${spotsLeft} of ${session.max_capacity} available` },
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

        {description && (
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-2">About this class</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        )}

        {/* Cancellation policy — shown before booking so there are no surprises */}
        {!isPast && status !== 'success' && status !== 'already_booked' && (
          <div className="bg-[#E0EEF0]/50 border border-[#006D77]/15 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-[#006D77]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Cancellation policy</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Free cancellation up to <span className="font-semibold text-[#006D77]">{cancelWindowHours} hours</span> before
                class — that&apos;s until <span className="font-semibold text-[#006D77]">{cancelDeadlineStr}</span>.
                Cancel in time and your session goes back to your package.
              </p>
            </div>
          </div>
        )}

        {!isPast && status === 'idle' && !isFull && myPackages.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#006D77]" /> Use Package
            </h3>
            <div className="space-y-2">
              {myPackages.map(pkg => (
                <button key={pkg.id} onClick={() => setSelectedPackageId(pkg.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    selectedPackageId === pkg.id ? 'border-[#006D77] bg-[#006D77]/5' : 'border-border bg-white'
                  }`}>
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4">
        {/* Class already took place — booking is closed */}
        {isPast && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">This class has already taken place</span>
            </div>
            <Link href="/schedule" className="w-full py-3 bg-[#006D77] text-white font-semibold rounded-xl text-center">
              Browse Upcoming Classes
            </Link>
          </div>
        )}
        {status === 'already_booked' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[#4CAF50]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">You&apos;re booked!</span>
            </div>
            <Link href="/bookings" className="w-full py-3 border border-[#006D77] text-[#006D77] font-semibold rounded-xl text-center">
              View My Bookings
            </Link>
          </div>
        )}
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
        {!isPast && status === 'idle' && !isFull && myPackages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#B8612A] justify-center">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">You need a package to book</span>
            </div>
            <Link href="/packages" className="block w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl text-center">
              Browse Packages
            </Link>
          </div>
        )}
        {/* Waitlisted */}
        {status === 'waitlisted' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[#006D77]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Added to waitlist!</span>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              You'll get a notification if a spot opens up 🎉
            </p>
          </div>
        )}
        {/* Full — Join Waitlist */}
        {!isPast && isFull && status !== 'already_booked' && status !== 'success' && status !== 'waitlisted' && (
          <button onClick={handleJoinWaitlist} disabled={status === 'loading'}
            className="w-full py-3.5 border-2 border-[#B8612A] text-[#B8612A] font-semibold rounded-xl hover:bg-[#B8612A]/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {status === 'loading'
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : 'Join Waitlist'
            }
          </button>
        )}
        {!isPast && status === 'idle' && !isFull && myPackages.length > 0 && (
          <button onClick={handleBook} disabled={!selectedPackageId}
            className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#006D77]/20">
            Confirm Booking
          </button>
        )}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
            <span className="text-sm text-muted-foreground">Booking your spot...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-center text-sm text-red-500">Something went wrong. Try again.</p>
            <button onClick={() => setStatus('idle')}
              className="w-full py-3 border border-border rounded-xl text-sm font-medium">Try Again</button>
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
