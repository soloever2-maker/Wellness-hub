export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] text-white px-4 py-3 rounded-full font-semibold text-sm hover:shadow-md transition-shadow">
        Book a Class
      </button>
      <button className="bg-white border-2 border-primary text-primary px-4 py-3 rounded-full font-semibold text-sm hover:bg-secondary/20 transition-colors">
        My Package
      </button>
      <button className="bg-white border-2 border-border text-foreground px-4 py-3 rounded-full font-semibold text-sm hover:bg-muted transition-colors">
        Contact Enjy
      </button>
    </div>
  )
}
