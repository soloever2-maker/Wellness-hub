interface BookingSectionProps {
  state: 'available' | 'full' | 'booked'
}

export function BookingSection({ state }: BookingSectionProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-2xl shadow-primary/10">
      <div className="max-w-sm mx-auto px-4 py-4">
        {state === 'available' && (
          <>
            <button className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-4 rounded-[12px] hover:shadow-lg transition-all">
              Book This Class
            </button>
            <p className="text-xs text-secondary-foreground text-center mt-2">
              1 session will be deducted from your package
            </p>
          </>
        )}

        {state === 'full' && (
          <>
            <button className="w-full border-2 border-primary text-primary font-bold py-4 rounded-[12px] hover:bg-primary/5 transition-all">
              Join Waitlist
            </button>
            <p className="text-xs text-secondary-foreground text-center mt-2">
              3 people waiting
            </p>
          </>
        )}

        {state === 'booked' && (
          <>
            <div className="w-full bg-green-50 border border-green-200 rounded-[12px] py-4 text-center">
              <p className="text-sm font-bold text-green-700">You&apos;re Booked! ✓</p>
            </div>
            <button className="w-full mt-3 text-secondary-foreground font-medium py-2 text-sm hover:text-foreground transition-all">
              Cancel Booking
            </button>
          </>
        )}
      </div>
    </div>
  )
}
