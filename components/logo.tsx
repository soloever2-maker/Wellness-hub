import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { w: 60, h: 60 },
  md: { w: 100, h: 100 },
  lg: { w: 160, h: 160 },
  xl: { w: 220, h: 220 },
}

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const { w, h } = sizeMap[size]
  const src = variant === 'icon' ? '/icon.png' : '/logo.png'

  return (
    <Image
      src={src}
      alt="Align with Enjy"
      width={w}
      height={h}
      className={className}
      priority
    />
  )
}
