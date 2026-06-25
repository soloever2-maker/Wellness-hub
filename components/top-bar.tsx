import { Bell } from 'lucide-react'

export function TopBar() {
  return (
    <div className="bg-background px-4 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-foreground">
        Good morning, Sarah 👋
      </h1>
      <button className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors">
        <Bell className="w-5 h-5 text-foreground" />
      </button>
    </div>
  )
}
