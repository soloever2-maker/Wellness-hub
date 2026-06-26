'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MonsteraLeaf } from './monstera-leaf'

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
    timerRef.current = setTimeout(() => setShow(false), 650)

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
        style={{ background: 'linear-gradient(180deg, rgba(250,250,247,0.95) 0%, rgba(224,238,240,0.95) 100%)' }}
      >
        <div className={`flex flex-col items-center gap-3 transition-transform duration-500 ${
          show ? 'scale-100' : 'scale-90'
        }`}>
          <div className={show ? 'animate-leaf-sway' : ''}>
            <MonsteraLeaf size={64} />
          </div>
          <p className="text-xs font-semibold text-[#006D77] tracking-wider">Align with Enjy</p>
        </div>
      </div>
    </>
  )
}
