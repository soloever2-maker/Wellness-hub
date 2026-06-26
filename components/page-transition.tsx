'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const prevPath = useRef(pathname)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    setShow(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShow(false), 600)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pathname])

  return (
    <>
      {children}

      {/* Transition overlay */}
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-300 ${
          show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'linear-gradient(160deg, rgba(250,250,247,0.96) 0%, rgba(224,238,240,0.96) 50%, rgba(255,217,184,0.96) 100%)' }}
      >
        <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}>
          <div className={show ? 'animate-leaf-sway' : ''} style={{ mixBlendMode: 'multiply' }}>
            <Image src="/icon.png" alt="" width={64} height={64} className="object-contain" />
          </div>
        </div>
      </div>
    </>
  )
}
