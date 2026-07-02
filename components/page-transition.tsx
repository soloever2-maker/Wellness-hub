// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   components/page-transition.tsx
// (قيمة ابتدائية للـ useRef — صلّح الـ error السادس)
// ============================================================

'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const prevPath = useRef(pathname)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    setShow(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShow(false), 800)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pathname])

  return (
    <>
      {children}

      {/* Full-screen transition overlay */}
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-400 ${
          show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'linear-gradient(160deg, rgba(245,241,230,0.97) 0%, rgba(224,238,240,0.97) 50%, rgba(255,217,184,0.97) 100%)',
        }}
      >
        <div
          className={`flex flex-col items-center gap-4 transition-all duration-500 ${
            show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {/* Logo */}
          <div className={show ? 'animate-pulse' : ''} style={{ mixBlendMode: 'multiply', animationDuration: '1.5s' }}>
            <Image src="/icon.png" alt="" width={80} height={80} className="object-contain" priority />
          </div>

          {/* Loading bar */}
          <div className="w-32 h-1 bg-[#006D77]/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-[#006D77] to-[#E86500] rounded-full transition-all ease-out ${
                show ? 'w-full duration-700' : 'w-0 duration-0'
              }`}
            />
          </div>
        </div>
      </div>
    </>
  )
}
