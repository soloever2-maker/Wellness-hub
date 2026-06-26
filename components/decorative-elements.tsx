interface DecorativeSwirlProps {
  className?: string
  color?: string
}

export function DecorativeSwirl({ className = '', color = '#006D77' }: DecorativeSwirlProps) {
  return (
    <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20 C 5 8, 25 8, 25 20 C 25 32, 45 32, 45 20 C 45 8, 65 8, 65 20 C 65 32, 85 32, 85 20 C 85 8, 105 8, 105 20 C 105 32, 115 32, 115 20" />
    </svg>
  )
}

export function DecorativeLotus({ className = '', color = '#E86500' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 65 C 15 50, 10 30, 18 12 C 22 20, 28 28, 30 40" />
      <path d="M30 65 C 45 50, 50 30, 42 12 C 38 20, 32 28, 30 40" />
      <path d="M30 65 C 30 50, 30 30, 30 8 C 30 20, 30 28, 30 40" />
    </svg>
  )
}
