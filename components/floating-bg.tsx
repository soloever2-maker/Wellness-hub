'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Pages where we DON'T show the floating background
const EXCLUDED = ['/login', '/admin', '/join', '/select-role']

export function FloatingBg() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const isExcluded = EXCLUDED.some(p => pathname.startsWith(p))

  useEffect(() => {
    if (isExcluded) return
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const particles: {
      x: number; y: number; size: number; speedX: number; speedY: number
      opacity: number; rotation: number; rotSpeed: number; type: number; color: string
    }[] = []

    // Fewer particles & lower opacity than login — gentle background feel
    for (let i = 0; i < 22; i++) {
      const colorChoice = Math.random()
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 18 + 8,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.09 + 0.03,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.008,
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
        ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore()
      }
      ctx.beginPath(); ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2)
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore()
    }

    const drawSwirl = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = opacity
      ctx.beginPath(); ctx.arc(0, 0, size * 0.4, 0, Math.PI * 1.6)
      ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore()
    }

    const drawInfinity = (x: number, y: number, size: number, opacity: number, rotation: number, color: string) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = opacity
      ctx.beginPath(); ctx.arc(-size * 0.3, 0, size * 0.3, 0, Math.PI * 2)
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke()
      ctx.beginPath(); ctx.arc(size * 0.3, 0, size * 0.3, 0, Math.PI * 2)
      ctx.stroke(); ctx.restore()
    }

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
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [isExcluded])

  if (isExcluded) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
