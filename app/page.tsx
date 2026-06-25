import { TopBar } from '@/components/top-bar'
import { PackageCard } from '@/components/package-card'
import { TodaysClasses } from '@/components/todays-classes'
import { ThisWeekSection } from '@/components/this-week-section'
import { QuickActions } from '@/components/quick-actions'
import { BottomNav } from '@/components/bottom-nav'

export default function Page() {
  return (
    <main className="bg-background min-h-screen pb-24 flex flex-col">
      <TopBar />
      <div className="px-4 pt-4 pb-8 space-y-6 flex-1">
        <PackageCard />
        <TodaysClasses />
        <ThisWeekSection />
        <QuickActions />
      </div>
      <BottomNav />
    </main>
  )
}
