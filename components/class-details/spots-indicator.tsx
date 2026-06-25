export function SpotsIndicator() {
  const booked = 8
  const total = 12
  const remaining = total - booked
  const percentage = (booked / total) * 100

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-foreground">{booked} of {total} booked</p>
          <p className="text-sm font-semibold text-primary">{remaining} spots remaining</p>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
