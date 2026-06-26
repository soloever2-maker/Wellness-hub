'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, Clock, Fingerprint } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginUser, registerUser } from '@/lib/auth'
import {
  isBiometricSupported,
  isBiometricEnabled,
  getSavedEmail,
  saveEmail,
  authenticateWithBiometric,
} from '@/lib/biometric'

type Mode = 'login' | 'register' | 'pending'

// Floating lotus particles
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number; y: number; size: number; speedX: number; speedY: number;
      opacity: number; rotation: number; rotSpeed: number; type: number
    }[] = []

    // Create 18 particles
    for (let i = 0; i < 18; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 18 + 8,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.25 + 0.05,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        type: Math.floor(Math.random() * 2), // 0 = lotus petal, 1 = swirl dot
      })
    }

    const drawLotus = (
      ctx: CanvasRenderingContext2D,
      x: number, y: number, size: number,
      opacity: number, rotation: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      const petalCount = 5
      for (let i = 0; i < petalCount; i++) {
        ctx.save()
        ctx.rotate((i / petalCount) * Math.PI * 2)
        ctx.beginPath()
        ctx.ellipse(0, -size * 0.6, size * 0.25, size * 0.6, 0, 0, Math.PI * 2)
        ctx.strokeStyle = '#E86500'
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()
      }

      // Center circle
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2)
      ctx.strokeStyle = '#006D77'
      ctx.lineWidth = 1.2
      ctx.stroke()

      ctx.restore()
    }

    const drawSwirl = (
      ctx: CanvasRenderingContext2D,
      x: number, y: number, size: number,
      opacity: number, rotation: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.4, 0, Math.PI * 1.5)
      ctx.strokeStyle = '#006D77'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    }

    let animId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        if (p.type === 0) {
          drawLotus(ctx, p.x, p.y, p.size, p.opacity, p.rotation)
        } else {
          drawSwirl(ctx, p.x, p.y, p.size, p.opacity, p.rotation)
        }

        p.x += p.speedX
        p.y += p.speedY
        p.rotation += p.rotSpeed

        if (p.x < -50) p.x = canvas.width + 50
        if (p.x > canvas.width + 50) p.x = -50
        if (p.y < -50) p.y = canvas.height + 50
        if (p.y > canvas.height + 50) p.y = -50
      })

      animId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBiometric, setShowBiometric] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })

  useEffect(() => {
    const saved = getSavedEmail()
    if (saved) setForm(f => ({ ...f, email: saved }))
    setShowBiometric(isBiometricSupported() && isBiometricEnabled())
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await loginUser(form.email, form.password)
      saveEmail(form.email)
      router.replace(user.role === 'admin' ? '/select-role' : '/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'PENDING') setMode('pending')
      else if (msg === 'REJECTED') setError('Your request was not approved. Contact Enjy.')
      else setError('Wrong email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    setError('')
    try {
      const verified = await authenticateWithBiometric()
      if (!verified) {
        setError('Biometric authentication failed. Use your password instead.')
        setBiometricLoading(false)
        return
      }

      // Check if Supabase session is still valid
      const { getSession } = await import('@/lib/auth')
      const session = await getSession()

      if (session) {
        // Session valid → go home
        const { getCurrentUser } = await import('@/lib/auth')
        const user = await getCurrentUser()
        router.replace(user?.role === 'admin' ? '/select-role' : '/')
      } else {
        // Session expired → ask user to login with password once
        setError('Your session expired. Please sign in with your password once to refresh it.')
      }
    } catch {
      setError('Biometric failed. Try your password.')
    } finally {
      setBiometricLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registerUser(form.fullName, form.phone, form.email, form.password)
      setMode('pending')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('already registered') ? 'Email already registered. Try signing in.' : msg)
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #FAFAF7 0%, #E0EEF0 50%, #FFD9B8 100%)' }}>
      <FloatingParticles />

      <div className="relative z-10 flex-1 flex flex-col px-6 py-8 max-w-sm mx-auto w-full">

        {/* ── LOGO SECTION ── */}
        <div className="pt-10 pb-8 flex flex-col items-center">
          <div className="relative mb-2">
            <Image
              src="/logo.png"
              alt="Align with Enjy"
              width={220}
              height={220}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <p className="text-xs text-[#E86500] font-semibold tracking-[0.2em] uppercase mt-1">
            Wellness & Yoga Center
          </p>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50/80 backdrop-blur border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* ── CARD ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-[#006D77]/10 border border-white p-6">

          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-1">Welcome Back</h2>
              <p className="text-xs text-muted-foreground text-center mb-5">Sign in to continue your journey</p>

              {showBiometric && (
                <>
                  <button onClick={handleBiometricLogin} disabled={biometricLoading}
                    className="w-full mb-4 py-3.5 bg-[#006D77] text-white font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-[#004E5C] transition-colors shadow-md disabled:opacity-60">
                    {biometricLoading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Fingerprint className="w-5 h-5" />}
                    Sign in with Biometrics
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" required autoComplete="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                </button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Don&apos;t have an account?{' '}
                <button onClick={() => { setMode('register'); setError('') }} className="text-[#E86500] font-semibold">Request Access</button>
              </p>
            </>
          )}

          {mode === 'register' && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-1">Request Access</h2>
              <p className="text-xs text-muted-foreground text-center mb-5">Enjy will approve your request shortly</p>

              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" required autoComplete="name" value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Sarah Ahmed"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-xl text-sm font-medium">+20</span>
                    <input type="tel" required autoComplete="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="10X XXXX XXXX"
                      className="flex-1 bg-background border border-border rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" required autoComplete="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Submit Request'}
                </button>
                <p className="text-xs text-center text-muted-foreground">By continuing, you agree to our Terms & Privacy Policy</p>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-[#E86500] font-semibold">Sign In</button>
              </p>
            </>
          )}

          {mode === 'pending' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#FFD9B8]/40 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-[#E86500]" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Request Submitted ✓</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Enjy will review your request and activate your account shortly.
              </p>
              <div className="bg-background rounded-2xl p-4 mb-4 w-full">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#006D77]" />
                  <p className="text-sm font-medium text-foreground text-left">Request received</p>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                  <p className="text-sm text-foreground text-left">Pending Enjy&apos;s approval</p>
                </div>
              </div>
              <button onClick={() => setMode('login')} className="text-sm font-medium text-[#006D77]">
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
