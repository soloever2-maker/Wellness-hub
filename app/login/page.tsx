'use client'

import { useState } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'

type Mode = 'login' | 'register' | 'pending'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: connect to Supabase
    router.push('/')
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: connect to Supabase + set status='pending'
    setMode('pending')
  }

  return (
    <main className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#006D77]/5 -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#E86500]/5 translate-y-1/3 -translate-x-1/3" />

      <div className="relative flex-1 flex flex-col px-6 py-8">
        {/* Logo */}
        <div className="pt-8 pb-6 flex flex-col items-center">
          <Logo size="lg" />
        </div>

        {mode === 'login' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">Sign in to continue your wellness journey</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-lg shadow-[#006D77]/20"
              >
                Sign In
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button onClick={() => setMode('register')} className="text-[#E86500] font-semibold">
                  Request Access
                </button>
              </p>
            </div>
          </>
        )}

        {mode === 'register' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Request Access</h2>
              <p className="text-sm text-muted-foreground">Your account will be activated after Enjy approves your request</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Sarah Ahmed"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-foreground font-medium">+20</span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10X XXXX XXXX"
                    className="w-full bg-white border border-border rounded-xl pl-20 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors shadow-lg shadow-[#006D77]/20"
              >
                Submit Request
              </button>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-[#E86500] font-semibold">
                  Sign In
                </button>
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
              Your account is now pending approval. Enjy will review your request and activate your account shortly.
              <br /><br />
              You&apos;ll be notified once it&apos;s approved.
            </p>

            <div className="bg-white border border-border rounded-2xl p-4 mb-6 w-full max-w-xs">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#006D77]" />
                <p className="text-sm font-medium text-foreground text-left">Request received</p>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                <p className="text-sm font-medium text-foreground text-left">Pending Enjy&apos;s approval</p>
              </div>
            </div>

            <button
              onClick={() => setMode('login')}
              className="text-sm font-medium text-[#006D77]"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
