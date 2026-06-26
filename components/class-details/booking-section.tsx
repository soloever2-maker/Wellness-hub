'use client'

interface BookingSectionProps {
  state: 'available' | 'full' | 'booked'
  onBook?: () => void
  onJoinWaitlist?: () => void
  onCancel?: () => void
}

export function BookingSection({ state, onBook, onJoinWaitlist, onCancel }: BookingSectionProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-2xl shadow-primary/10">
      <div className="max-w-sm mx-auto px-4 py-4">
        {state === 'available' && (
          <>
            <button
              onClick={onBook}
              className="w-full bg-gradient-to-r from-[#006D77] to-[#E86500] text-white font-bold py-4 rounded-[12px] hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Book This Class
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              1 session will be deducted from your package
            </p>
          </>
        )}

        {state === 'full' && (
          <>
            <button
              onClick={onJoinWaitlist}
              className="w-full border-2 border-[#006D77] text-[#006D77] font-bold py-4 rounded-[12px] hover:bg-[#006D77]/5 transition-all active:scale-[0.98]"
            >
              Join Waitlist
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              3 people waiting
            </p>
          </>
        )}

        {state === 'booked' && (
          <>
            <div className="w-full bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-[12px] py-4 text-center">
              <p className="text-sm font-bold text-[#4CAF50]">You&apos;re Booked! ✓</p>
            </div>
            <button
              onClick={onCancel}
              className="w-full mt-3 text-muted-foreground font-medium py-2 text-sm hover:text-[#E53935] transition-all"
            >
              Cancel Booking
            </button>
          </>
        )}
      </div>
    </div>
  )
}
