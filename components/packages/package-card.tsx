'use client'

import { Calendar } from 'lucide-react'

interface PackageCardProps {
  name: string
  sessions: number
  validDays: number
  price: number
  isPopular: boolean
}

export function PackageCard({
  name,
  sessions,
  validDays,
  price,
  isPopular,
}: PackageCardProps) {
  return (
    <div className="relative bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      {isPopular && (
        <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold">
          Most Popular
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground mb-6">{name}</h3>

      {/* Session badge */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <span className="text-3xl font-bold text-white">{sessions}</span>
        </div>
        <p className="text-xs text-secondary-foreground mt-2">classes</p>
      </div>

      {/* Valid for */}
      <div className="flex items-center justify-center gap-2 mb-6 pb-6 border-b border-border">
        <Calendar className="w-4 h-4 text-secondary-foreground" />
        <p className="text-sm text-secondary-foreground">Valid for {validDays} days</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <p className="text-3xl font-bold text-foreground">{price}</p>
        <p className="text-xs text-secondary-foreground">EGP</p>
      </div>

      {/* CTA Button */}
      <button className="w-full bg-primary hover:bg-[#c91f7d] text-white py-3 rounded-[12px] font-semibold transition-colors">
        Buy Package
      </button>
    </div>
  )
}
