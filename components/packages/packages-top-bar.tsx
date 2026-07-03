import { Bell } from 'lucide-react'

export function PackagesTopBar() {
  return (
    <div className="bg-background px-4 pt-3 pb-4 flex items-center justify-between border-b border-border">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground">Packages</h1>
        <p className="text-sm text-secondary-foreground mt-1">Choose your plan</p>
      </div>
      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
        <Bell className="w-6 h-6 text-foreground" />
      </button>
    </div>
  )
}
