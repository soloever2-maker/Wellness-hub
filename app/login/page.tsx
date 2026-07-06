'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, Clock, Fingerprint, CalendarDays, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginUser, registerUser } from '@/lib/auth'
import { LoginSplash } from '@/components/login-splash'
import { playSingingBowl } from '@/lib/sounds'
import {
  isBiometricSupported,
  isBiometricEnabled,
  getSavedEmail,
  getCredentialsViaBiometric,
  updateStoredBiometricPassword,
} from '@/lib/biometric'

type Mode = 'login' | 'register' | 'pending' | 'forgot'

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
        type: Math.floor(Math.random() * 3),
        color: colorChoice < 0.5 ? '#006D77' : (colorChoice < 0.85 ? '#B8612A' : '#004E5C'),
      })
    }

    const drawLotus = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = opacity
      const petals = 5
      for (let i = 0; i < petals; i++) {
        ctx.save(); ctx.rotate((i / petals) * Math.PI * 2)
        ctx.beginPath(); ctx.ellipse(0, -size * 0.55, size * 0.22, size * 0.55, 0, 0, Math.PI * 2)
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore()
      }
      ctx.beginPath(); ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2)
      ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore()
    }

    const drawSwirl = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = opacity
      ctx.beginPath(); ctx.arc(0, 0, size * 0.4, 0, Math.PI * 1.6)
      ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore()
    }

    const drawInfinity = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = opacity
      ctx.beginPath(); ctx.arc(-size * 0.3, 0, size * 0.3, 0, Math.PI * 2)
      ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke()
      ctx.beginPath(); ctx.arc(size * 0.3, 0, size * 0.3, 0, Math.PI * 2)
      ctx.stroke(); ctx.restore()
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        if (p.type === 0) drawLotus(p.x, p.y, p.size, p.opacity, p.rotation, p.color)
        else if (p.type === 1) drawSwirl(p.x, p.y, p.size, p.opacity, p.rotation, p.color)
        else drawInfinity(p.x, p.y, p.size, p.opacity, p.rotation, p.color)
        p.x += p.speedX; p.y += p.speedY; p.rotation += p.rotSpeed
        if (p.x < -60) p.x = window.innerWidth + 60
        if (p.x > window.innerWidth + 60) p.x = -60
        if (p.y < -60) p.y = window.innerHeight + 60
        if (p.y > window.innerHeight + 60) p.y = -60
      })
      animId = requestAnimationFrame(animate)
    }
    animate()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  // Redirected here by AuthGuard with an unapproved session? Show the
  // pending screen instead of the sign-in form.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('pending') === '1') {
        setMode('pending')
        window.history.replaceState(null, '', '/login')
      }
    } catch { /* ignore */ }
  }, [])
  const [showSplash, setShowSplash] = useState(false)
  const [splashRedirect, setSplashRedirect] = useState('')
  const [splashName, setSplashName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBiometric, setShowBiometric] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', password: '', dateOfBirth: '' })

  // Forgot password (self-service reset) state
  const [forgotForm, setForgotForm] = useState({ phone: '', dateOfBirth: '', clientId: '', newPassword: '', confirmPassword: '' })
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotDobMissing, setForgotDobMissing] = useState(false)

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotDobMissing(false)

    if (forgotForm.newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.')
      return
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError('Passwords do not match.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          phone: forgotForm.phone,
          date_of_birth: forgotForm.dateOfBirth,
          client_id: forgotForm.clientId,
          new_password: forgotForm.newPassword,
        }),
      })
      const data = await res.json()

      if (data.ok) {
        setForgotSuccess(true)
        playSingingBowl(0.4)
        return
      }

      switch (data.error) {
        case 'DOB_MISSING':
          setForgotDobMissing(true)
          break
        case 'RATE_LIMITED':
          setForgotError('Too many attempts. Please try again in an hour.')
          break
        case 'PASSWORD_TOO_SHORT':
          setForgotError('New password must be at least 6 characters.')
          break
        default:
          setForgotError("The details don't match our records. Please double-check and try again.")
      }
    } catch {
      setForgotError('Connection error. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => {
    setShowBiometric(isBiometricSupported() && isBiometricEnabled())
  }, [])

  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const fitToScreen = () => {
      // window.innerHeight فقط — مش visualViewport
      // عشان الـ keyboard لما يظهر ميصغّرش المحتوى
      const availableHeight = window.innerHeight
      const naturalHeight = el.scrollHeight
      const nextScale = naturalHeight > availableHeight ? availableHeight / naturalHeight : 1
      setScale(Math.max(nextScale, 0.65))
    }

    fitToScreen()
    const resizeObserver = new ResizeObserver(fitToScreen)
    resizeObserver.observe(el)
    window.addEventListener('resize', fitToScreen)
    // ← مش بنسمع لـ visualViewport.resize عشان الـ keyboard ميأثرش على الـ scale

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', fitToScreen)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { user } = await loginUser(form.phone, form.password)
      // Self-heal: keep the password stored behind the biometric gate
      // in sync — covers changes made on other devices or via
      // forgot-password (where no sync is possible).
      if (isBiometricEnabled()) updateStoredBiometricPassword(form.password)
      playSingingBowl(0.5)
      setSplashName(user.full_name?.split(' ')[0] || '')
      if (user.role === 'admin') {
        setSplashRedirect('/select-role')
      } else {
        const welcomed = localStorage.getItem(`welcomed_${user.id}`)
        if (!welcomed) { localStorage.setItem(`welcomed_${user.id}`, 'true'); setSplashRedirect('/profile?welcome=true') }
        else setSplashRedirect('/')
      }
      setShowSplash(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'PENDING') setMode('pending')
      else if (msg === 'REJECTED') setError('Your request was not approved. Contact Enjy.')
      else setError('Wrong email or password.')
    } finally { setLoading(false) }
  }

  const handleBiometricLogin = async () => {
    setBiometricLoading(true); setError('')
    try {
      const result = await getCredentialsViaBiometric()
      if (!result.ok) { setError(result.error); setBiometricLoading(false); return }
      const { user } = await loginUser(result.email, result.password)
      playSingingBowl(0.5)
      setSplashName(user.full_name?.split(' ')[0] || '')
      if (user.role === 'admin') {
        setSplashRedirect('/select-role')
      } else {
        const welcomed = localStorage.getItem(`welcomed_${user.id}`)
        if (!welcomed) { localStorage.setItem(`welcomed_${user.id}`, 'true'); setSplashRedirect('/profile?welcome=true') }
        else setSplashRedirect('/')
      }
      setShowSplash(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'PENDING') setMode('pending')
      else if (msg === 'REJECTED') setError('Your request was not approved.')
      else setError('Your password changed recently — sign in with your new password once, and biometric login will work again.')
    } finally { setBiometricLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')

    // Validate full name has at least first + last name
    const nameParts = form.fullName.trim().split(/\s+/)
    if (nameParts.length < 2 || nameParts.some(p => p.length === 0)) {
      setError('Please enter your first and last name (e.g. Sara Ahmed).')
      setLoading(false)
      return
    }

    // Validate date of birth
    if (!form.dateOfBirth) {
      setError('Please enter your date of birth.')
      setLoading(false)
      return
    }

    try {
      await registerUser(form.fullName, form.phone, form.password, form.dateOfBirth)
      setMode('pending')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || 'Registration failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <>
      {showSplash && (
        <LoginSplash
          userName={splashName}
          onFinished={() => router.replace(splashRedirect)}
        />
      )}
      <main className="h-dvh flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #F5F1E6 0%, #E0EEF0 50%, #EDD7C9 100%)' }}>
        <FloatingParticles />

        <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden px-6">
          {/* ↓ transition-transform + willChange لـ smooth scale على الموبايل */}
          <div
            ref={contentRef}
            style={{ transform: `scale(${scale})`, willChange: 'transform' }}
            className="origin-center flex flex-col py-8 max-w-sm w-full transition-transform duration-300 ease-out"
          >

            {/* Logo */}
            <div className="pt-8 pb-6 flex flex-col items-center">
              <div style={{ mixBlendMode: 'multiply' }}>
                <Image src="/logo.png" alt="Align with Enjy" width={220} height={220} className="object-contain" priority />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50/90 backdrop-blur border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Card */}
            <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl shadow-[#006D77]/10 border border-white p-6">

              {mode === 'login' && (<>
                <h2 className="text-xl font-bold text-foreground text-center mb-1">Welcome Back</h2>
                <p className="text-xs text-muted-foreground text-center mb-5">Sign in to continue</p>
                {showBiometric && (<>
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
                </>)}
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                      className="text-xs text-[#006D77] font-medium mt-1.5 block">
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                  </button>
                </form>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => { setMode('register'); setError('') }} className="text-[#B8612A] font-semibold">Request Access</button>
                </p>
              </>)}

              {mode === 'forgot' && (<>
                <h2 className="text-xl font-bold text-foreground text-center mb-1">Reset Password</h2>
                {forgotSuccess ? (
                  <div className="py-6 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                      <Check className="w-7 h-7 text-[#4CAF50]" />
                    </div>
                    <p className="text-sm font-medium text-foreground text-center">Password updated!</p>
                    <p className="text-xs text-muted-foreground text-center">You can now sign in with your new password.</p>
                    <button
                      onClick={() => {
                        setMode('login'); setError('')
                        setForgotSuccess(false)
                        setForgotForm({ phone: '', dateOfBirth: '', clientId: '', newPassword: '', confirmPassword: '' })
                      }}
                      className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-md mt-2">
                      Back to Sign In
                    </button>
                  </div>
                ) : forgotDobMissing ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center mb-2 leading-relaxed">
                      Your birth date isn&apos;t on file, so we can&apos;t verify your identity automatically. Please contact the studio to reset your password.
                    </p>
                    <a
                      href={`https://wa.me/201063751653?text=${encodeURIComponent(`Hi Enjy, I forgot my password and my birth date isn't registered.\n\nMy phone number: ${forgotForm.phone.trim()}\n\nCould you please reset it for me?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#4CAF50] text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-[#3d8b40] transition-colors">
                      Contact via WhatsApp
                    </a>
                    <button onClick={() => setForgotDobMissing(false)}
                      className="w-full py-3 text-sm text-[#006D77] font-medium">
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
                      Verify your identity to set a new password. Your Client ID is shown on your profile card.
                    </p>
                    <form onSubmit={handleForgotReset} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type="tel" required value={forgotForm.phone}
                            onChange={e => { setForgotForm({ ...forgotForm, phone: e.target.value }); setForgotError('') }}
                            placeholder="01XXXXXXXXX"
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth</label>
                          <input type="date" required value={forgotForm.dateOfBirth}
                            onChange={e => { setForgotForm({ ...forgotForm, dateOfBirth: e.target.value }); setForgotError('') }}
                            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client ID</label>
                          <input type="number" required min={1} value={forgotForm.clientId}
                            onChange={e => { setForgotForm({ ...forgotForm, clientId: e.target.value }); setForgotError('') }}
                            placeholder="e.g. 42"
                            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
                            value={forgotForm.newPassword}
                            onChange={e => { setForgotForm({ ...forgotForm, newPassword: e.target.value }); setForgotError('') }}
                            placeholder="At least 6 characters"
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
                            value={forgotForm.confirmPassword}
                            onChange={e => { setForgotForm({ ...forgotForm, confirmPassword: e.target.value }); setForgotError('') }}
                            placeholder="Re-enter new password"
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                        </div>
                      </div>
                      {forgotError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-red-600">{forgotError}</p>
                        </div>
                      )}
                      <button type="submit" disabled={forgotLoading}
                        className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                        {forgotLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
                      </button>
                    </form>
                  </>
                )}
                {!forgotSuccess && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Remembered it?{' '}
                    <button onClick={() => { setMode('login'); setError(''); setForgotError(''); setForgotDobMissing(false) }} className="text-[#B8612A] font-semibold">Back to Sign In</button>
                  </p>
                )}
              </>)}

              {mode === 'register' && (<>
                <h2 className="text-xl font-bold text-foreground text-center mb-1">Request Access</h2>
                <p className="text-xs text-muted-foreground text-center mb-5">Enjy will approve your request shortly</p>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Full Name <span className="text-[#E53935]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="text" required autoComplete="name" value={form.fullName}
                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                        placeholder="First & Last name (e.g. Sara Ahmed)"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">First and last name required</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Date of Birth <span className="text-[#E53935]">*</span>
                    </label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="date" required value={form.dateOfBirth}
                        onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77] text-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Phone Number <span className="text-[#E53935]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="tel" required autoComplete="tel" value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Password <span className="text-[#E53935]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
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
                  <button onClick={() => { setMode('login'); setError('') }} className="text-[#B8612A] font-semibold">Sign In</button>
                </p>
              </>)}

              {mode === 'pending' && (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-[#EDD7C9]/40 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-[#B8612A]" />
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
        </div>
      </main>
    </>
  )
}
