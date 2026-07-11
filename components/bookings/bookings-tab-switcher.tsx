interface BookingsTabSwitcherProps {
  activeTab: 'upcoming' | 'past'
  onTabChange: (tab: 'upcoming' | 'past') => void
}

export function BookingsTabSwitcher({ activeTab, onTabChange }: BookingsTabSwitcherProps) {
  return (
    <div className="flex gap-8 border-b border-border pb-4">
      <button
        onClick={() => onTabChange('upcoming')}
        className={`pb-2 font-semibold text-sm transition-all ${
          activeTab === 'upcoming'
            ? 'text-primary border-b-2 border-primary'
            : 'text-text-secondary border-b-2 border-transparent'
        }`}
      >
        Upcoming
      </button>
      <button
        onClick={() => onTabChange('past')}
        className={`pb-2 font-semibold text-sm transition-all ${
          activeTab === 'past'
            ? 'text-primary border-b-2 border-primary'
            : 'text-text-secondary border-b-2 border-transparent'
        }`}
      >
        Past
      </button>
    </div>
  )
}
