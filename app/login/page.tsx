'use client'

import { useState, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(45)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <main className="bg-background min-h-screen flex flex-col">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-secondary/30 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-20 left-0 w-32 h-32 rounded-full bg-secondary/20 -translate-x-1/2" />

      <div className="relative flex-1 flex flex-col px-6">
        {step === 'phone' ? (
          <>
            {/* Logo */}
            <div className="pt-20 pb-8 text-center">
              <div className="text-5xl mb-4">🌸</div>
              <h1 className="text-3xl font-bold text-[#D63384]">The Wellness Hub</h1>
              <p className="text-sm text-muted-foreground mt-2">Your wellness journey starts here</p>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full -mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-8">Welcome Back</h2>

              {/* Phone Input */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-3.5 bg-white border border-border rounded-xl text-sm text-foreground min-w-[90px]">
                    🇪🇬 +20
                  </div>
                  <input
                    type="tel"
                    placeholder="10X XXXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3.5 bg-white border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#D63384]/30 focus:border-[#D63384]"
                  />
                </div>
              </div>

              {/* Send OTP Button */}
              <button
                onClick={() => setStep('otp')}
                className="w-full py-4 bg-gradient-to-r from-[#D63384] to-[#7B2D8E] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              >
                Send Verification Code
              </button>

              <p className="text-xs text-center text-muted-foreground mt-6">
                By continuing, you agree to our <span className="text-[#D63384]">Terms</span> & <span className="text-[#D63384]">Privacy Policy</span>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* OTP Step */}
            <div className="pt-6">
              <button onClick={() => setStep('phone')} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full -mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Number</h2>
              <p className="text-sm text-muted-foreground mb-10">
                We sent a code to <span className="font-medium text-foreground">+20 {phone || '10X XXXX XXX'}</span>
              </p>

              {/* OTP Inputs */}
              <div className="flex gap-3 justify-center mb-8">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold bg-white border-2 rounded-xl focus:outline-none transition-colors ${
                      digit
                        ? 'border-[#D63384] text-foreground'
                        : 'border-border text-foreground focus:border-[#D63384]'
                    }`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button className="w-full py-4 bg-gradient-to-r from-[#D63384] to-[#7B2D8E] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
                Verify
              </button>

              <div className="text-center mt-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {"Didn't receive a code?"} <span className="text-[#D63384] font-medium">Resend in 0:{countdown.toString().padStart(2, '0')}</span>
                </p>
                <button onClick={() => setStep('phone')} className="text-sm text-muted-foreground underline">
                  Change number
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
