'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface LoginSplashProps {
  onFinished: () => void
  userName?: string
}

export function LoginSplash({ onFinished, userName }: LoginSplashProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    // Phase timeline: enter(600ms) → hold(1400ms) → exit(500ms) → done
    const t1 = setTimeout(() => setPhase('hold'), 100)
    const t2 = setTimeout(() => setPhase('exit'), 1800)
    const t3 = setTimeout(() => onFinished(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinished])

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(160deg, #004E5C 0%, #006D77 40%, #E86500 100%)',
      }}
    >
      {/* Animated glow rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[1500ms] ease-out ${
            phase !== 'enter' ? 'w-[600px] h-[600px] opacity-0' : 'w-0 h-0 opacity-30'
          }`}
          style={{ border: '2px solid rgba(255,255,255,0.15)' }}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[2000ms] ease-out delay-200 ${
            phase !== 'enter' ? 'w-[800px] h-[800px] opacity-0' : 'w-0 h-0 opacity-20'
          }`}
          style={{ border: '2px solid rgba(255,255,255,0.1)' }}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[2500ms] ease-out delay-300 ${
            phase !== 'enter' ? 'w-[1000px] h-[1000px] opacity-0' : 'w-0 h-0 opacity-10'
          }`}
          style={{ border: '2px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center">
        {/* Logo with glow */}
        <div
          className={`relative transition-all duration-700 ease-out ${
            phase !== 'enter'
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-50 opacity-0 translate-y-4'
          }`}
        >
          <div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)',
              transform: 'scale(2.5)',
            }}
          />
          <div className="relative" style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}>
            <Image src="/icon.png" alt="" width={120} height={120} className="object-contain" priority />
          </div>
        </div>

        {/* Brand name */}
        <div
          className={`mt-6 text-center transition-all duration-700 delay-300 ease-out ${
            phase !== 'enter'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          <div
            className={`transition-all duration-700 delay-500 ease-out ${
              phase !== 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-[11px] text-white/60 font-semibold tracking-[0.3em] uppercase mt-2">
              Yoga · Fitness · Wellness
            </p>
          </div>
        </div>

        {/* Welcome message */}
        {userName && (
          <div
            className={`mt-8 transition-all duration-700 delay-700 ease-out ${
              phase !== 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-sm text-white/70 font-medium">
              Welcome back, <span className="text-white font-semibold">{userName}</span> 🧘‍♀️
            </p>
          </div>
        )}

        {/* Breathing dots */}
        <div
          className={`flex items-center gap-2 mt-10 transition-all duration-500 delay-500 ${
            phase !== 'enter' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {[0, 150, 300].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse"
              style={{ animationDelay: `${delay}ms`, animationDuration: '1.2s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
