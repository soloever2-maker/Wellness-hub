import { TopBar } from '@/components/top-bar'
import { NextBookingCard } from '@/components/next-booking-card'
import { PackageCard } from '@/components/package-card'
import { TodaysClasses } from '@/components/todays-classes'
import { ThisWeekSection } from '@/components/this-week-section'
import { QuickActions } from '@/components/quick-actions'
import { TrainerCard } from '@/components/trainer'
import { StudioTeaser } from '@/components/studio-teaser'
import { BottomNav } from '@/components/bottom-nav'

export default function Page() {
  return (
    <main className="bg-background min-h-screen pb-24 flex flex-col">
      <TopBar />
      <div className="px-4 pt-4 pb-8 space-y-5 flex-1">
        <NextBookingCard />
        <PackageCard />
        <QuickActions />
        <TodaysClasses />
        <ThisWeekSection />
        <StudioTeaser />
        <TrainerCard />
      </div>
      <BottomNav />
    </main>
  )
}
