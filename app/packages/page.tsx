'use client'

import { PackagesTopBar } from '@/components/packages/packages-top-bar'
import { PackageCard } from '@/components/packages/package-card'
import { PackagesInfoNote } from '@/components/packages/packages-info-note'
import { BottomNav } from '@/components/bottom-nav'

const packages = [
  {
    id: 1,
    name: 'Drop In',
    sessions: 1,
    validDays: 1,
    price: 200,
    isPopular: false,
  },
  {
    id: 2,
    name: '4 Classes',
    sessions: 4,
    validDays: 30,
    price: 700,
    isPopular: false,
  },
  {
    id: 3,
    name: '8 Classes',
    sessions: 8,
    validDays: 45,
    price: 1200,
    isPopular: true,
  },
  {
    id: 4,
    name: '12 Classes',
    sessions: 12,
    validDays: 60,
    price: 1600,
    isPopular: false,
  },
]

export default function PackagesPage() {
  return (
    <main className="bg-background min-h-screen pb-24 flex flex-col">
      <PackagesTopBar />
      <div className="px-4 pt-6 pb-8 space-y-4 flex-1 overflow-y-auto scrollbar-hide">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} {...pkg} />
        ))}
        <PackagesInfoNote />
      </div>
      <BottomNav activePage="book" />
    </main>
  )
}
