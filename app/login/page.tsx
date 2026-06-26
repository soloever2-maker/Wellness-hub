'use client'

import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, Clock, Fingerprint } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { loginUser, registerUser } from '@/lib/auth'
import {
  isBiometricSupported,
  isBiometricEnabled,
  getSavedEmail,
  saveEmail,
  authenticateWithBiometric,
} from '@/lib/biometric'

type Mode = 'login' | 'register' | 'pending'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBiometric, setShowBiometric] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    // Pre-fill saved email + show biometric button if enabled
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
      if (user.role === 'admin') {
        router.replace('/select-role')
      } else {
        router.replace('/')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg === 'PENDING') {
        setMode('pending')
      } else if (msg === 'REJECTED') {
        setError('Your request was not approved. Contact Enjy for more info.')
      } else {
        setError('Wrong email or password. Please try again.')
      }
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
      const email = getSavedEmail()
      if (!email) {
        setError('No saved account found. Please login with your password.')
        setBiometricLoading(false)
        return
      }
      // Re-use existing Supabase session (biometric just unlocks the app)
      router.replace('/')
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
      const msg = err instanceof Error ? err.message : 'Registration failed'
      if (msg.includes('already registered')) {
        setError('This email is already registered. Try signing in.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#006D77]/5 -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#E86500]/5 translate-y-1/3 -translate-x-1/3" />

      <div className="relative flex-1 flex flex-col px-6 py-8">
        {/* Logo */}
        <div className="pt-8 pb-6 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-white shadow-xl shadow-[#006D77]/10 border border-[#E0EEF0] flex items-center justify-center mb-4 ring-4 ring-[#E0EEF0]/40">
            <Logo variant="icon" size="md" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#006D77] tracking-tight">Align with Enjy</h1>
          <p className="text-xs text-[#E86500] font-medium tracking-wider uppercase mt-1">Wellness & Yoga Center</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {mode === 'login' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">Sign in to continue your wellness journey</p>
            </div>

            {/* Biometric Button */}
            {showBiometric && (
              <button
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full mb-4 py-4 bg-[#006D77] text-white font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-[#004E5C] transition-colors shadow-lg shadow-[#006D77]/20 disabled:opacity-60"
              >
                {biometricLoading
                  ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Fingerprint className="w-6 h-6" />
                }
                Sign in with Biometrics
              </button>
            )}

            {showBiometric && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or use password</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email" required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-lg shadow-[#006D77]/20 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Sign In'
                }
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button onClick={() => { setMode('register'); setError('') }}
                  className="text-[#E86500] font-semibold">Request Access</button>
              </p>
            </div>
          </>
        )}

        {mode === 'register' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Request Access</h2>
              <p className="text-sm text-muted-foreground">Enjy will approve your request shortly</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" required value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Sarah Ahmed" autoComplete="name"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
                <div className="relative flex">
                  <span className="flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-xl text-sm font-medium text-foreground">+20</span>
                  <input type="tel" required value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10X XXXX XXXX" autoComplete="tel"
                    className="flex-1 bg-white border border-border rounded-r-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com" autoComplete="email"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} required minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters" autoComplete="new-password"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-lg shadow-[#006D77]/20 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Submit Request'
                }
              </button>
              <p className="text-xs text-center text-muted-foreground">By continuing, you agree to our Terms & Privacy Policy</p>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }}
                  className="text-[#E86500] font-semibold">Sign In</button>
              </p>
            </div>
          </>
        )}

        {mode === 'pending' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[#FFD9B8]/40 flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-[#E86500]" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Request Submitted ✓</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
              Your account is pending approval. Enjy will review your request and activate your account shortly.
            </p>
            <div className="bg-white border border-border rounded-2xl p-4 mb-6 w-full max-w-xs">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-[#006D77]" />
                <p className="text-sm font-medium text-foreground text-left">Request received</p>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                <p className="text-sm font-medium text-foreground text-left">Pending Enjy&apos;s approval</p>
              </div>
            </div>
            <button onClick={() => setMode('login')} className="text-sm font-medium text-[#006D77]">
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
