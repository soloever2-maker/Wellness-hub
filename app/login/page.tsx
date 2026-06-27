'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, Clock, Fingerprint } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginUser, registerUser } from '@/lib/auth'
import { playSingingBowl } from '@/lib/sounds'
import {
  isBiometricSupported,
  isBiometricEnabled,
  getSavedEmail,

  getCredentialsViaBiometric,
} from '@/lib/biometric'

type Mode = 'login' | 'register' | 'pending'

// Floating brand elements (lotus + swirls)
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()

    const particles: {
      x: number; y: number; size: number; speedX: number; speedY: number;
      opacity: number; rotation: number; rotSpeed: number; type: number; color: string
    }[] = []

    // 38 particles - much more than before
    for (let i = 0; i < 38; i++) {
      const colorChoice = Math.random()
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 22 + 10,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.18 + 0.06,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        type: Math.floor(Math.random() * 3), // 0=lotus, 1=swirl, 2=infinity
        color: colorChoice < 0.5 ? '#006D77' : (colorChoice < 0.85 ? '#E86500' : '#004E5C'),
      })
    }

    const drawLotus = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity
      const petals = 5
      for (let i = 0; i < petals; i++) {
        ctx.save()
        ctx.rotate((i / petals) * Math.PI * 2)
        ctx.beginPath()
        ctx.ellipse(0, -size * 0.55, size * 0.22, size * 0.55, 0, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.4
        ctx.stroke()
        ctx.restore()
      }
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.restore()
    }

    const drawSwirl = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.4, 0, Math.PI * 1.6)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.8
      ctx.stroke()
      ctx.restore()
    }

    const drawInfinity = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.arc(-size * 0.3, 0, size * 0.3, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(size * 0.3, 0, size * 0.3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        if (p.type === 0) drawLotus(p.x, p.y, p.size, p.opacity, p.rotation, p.color)
        else if (p.type === 1) drawSwirl(p.x, p.y, p.size, p.opacity, p.rotation, p.color)
        else drawInfinity(p.x, p.y, p.size, p.opacity, p.rotation, p.color)

        p.x += p.speedX
        p.y += p.speedY
        p.rotation += p.rotSpeed

        if (p.x < -60) p.x = window.innerWidth + 60
        if (p.x > window.innerWidth + 60) p.x = -60
        if (p.y < -60) p.y = window.innerHeight + 60
        if (p.y > window.innerHeight + 60) p.y = -60
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBiometric, setShowBiometric] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', password: '' })

  useEffect(() => {
    setShowBiometric(isBiometricSupported() && isBiometricEnabled())
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await loginUser(form.phone, form.password)
      playSingingBowl(0.5)
      if (user.role === 'admin') {
        router.replace('/select-role')
      } else {
        // First-time login → go to profile for onboarding
        const welcomed = localStorage.getItem(`welcomed_${user.id}`)
        if (!welcomed) {
          localStorage.setItem(`welcomed_${user.id}`, 'true')
          router.replace('/profile?welcome=true')
        } else {
          router.replace('/')
        }
      }
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
      // Step 1: Verify biometric and retrieve stored credentials
      const result = await getCredentialsViaBiometric()
      if (!result.ok) {
        setError(result.error)
        setBiometricLoading(false)
        return
      }

      // Step 2: Login with the retrieved credentials (creates a fresh session)
      const { user } = await loginUser(result.email, result.password)
      playSingingBowl(0.5)
      if (user.role === 'admin') {
        router.replace('/select-role')
      } else {
        const welcomed = localStorage.getItem(`welcomed_${user.id}`)
        if (!welcomed) {
          localStorage.setItem(`welcomed_${user.id}`, 'true')
          router.replace('/profile?welcome=true')
        } else {
          router.replace('/')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'PENDING') setMode('pending')
      else if (msg === 'REJECTED') setError('Your request was not approved.')
      else setError('Login failed. Try with your password.')
    } finally {
      setBiometricLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registerUser(form.fullName, form.phone, form.password)
      setMode('pending')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #FAFAF7 0%, #E0EEF0 50%, #FFD9B8 100%)' }}>
      <FloatingParticles />

      <div className="relative z-10 flex-1 flex flex-col px-6 py-8 max-w-sm mx-auto w-full">

        {/* Logo Section — much bigger and clean */}
        <div className="pt-8 pb-6 flex flex-col items-center">
          <div style={{ mixBlendMode: 'multiply' }} className="mb-3">
            <Image
              src="/icon.png"
              alt="Align with Enjy"
              width={180}
              height={180}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-[#006D77] tracking-wide text-center">Align with Enjy</h1>
          <p className="text-xs text-[#E86500] font-semibold tracking-[0.25em] uppercase mt-2">
            Wellness & Yoga Center
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50/90 backdrop-blur border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl shadow-[#006D77]/10 border border-white p-6">

          {mode === 'login' && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-1">Welcome Back</h2>
              <p className="text-xs text-muted-foreground text-center mb-5">Sign in to continue</p>

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
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-xl text-sm font-medium text-muted-foreground">+20</span>
                    <input type="tel" required value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="10X XXXX XXXX"
                      className="flex-1 bg-background border border-border rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
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
                      placeholder="Your full name"
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
