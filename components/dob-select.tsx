'use client'

// ── iOS-friendly Date-of-Birth picker (shared) ──
// Native <input type="date"> on iOS shows an empty box (no placeholder
// support) and its wheel starts at today's date, forcing users to
// scroll back decades. Three dropdowns are unambiguous on every device.

import { useState } from 'react'

const DOB_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function DobSelect({ value, onChange, className = '' }: {
  value: string            // 'YYYY-MM-DD' or ''
  onChange: (v: string) => void
  className?: string
}) {
  // Internal state holds PARTIAL picks (e.g. day chosen, year not yet).
  // Deriving the selects only from `value` erased every partial pick,
  // because onChange('') fired until all three were set at once.
  const [vy, vm, vd] = value ? value.split('-') : ['', '', '']
  const [y, setY] = useState(vy)
  const [m, setM] = useState(vm)
  const [d, setD] = useState(vd)

  const now = new Date().getFullYear()
  const years = Array.from({ length: 90 }, (_, i) => String(now - 13 - i)) // 13..103 y/o
  const daysIn = (yy: string, mm: string) =>
    yy && mm ? new Date(Number(yy), Number(mm), 0).getDate() : 31
  const days = Array.from({ length: daysIn(y, m) }, (_, i) => String(i + 1).padStart(2, '0'))

  const emit = (yy: string, mm: string, dd: string) => {
    setY(yy); setM(mm); setD(dd)
    if (yy && mm && dd) {
      // Clamp day if month/year change shrinks the month (e.g. 31 → Feb)
      const maxD = daysIn(yy, mm)
      const safeD = String(Math.min(Number(dd), maxD)).padStart(2, '0')
      if (safeD !== dd) setD(safeD)
      onChange(`${yy}-${mm}-${safeD}`)
    } else {
      onChange('')
    }
  }

  const base = 'bg-background border border-border rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77] text-foreground'
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <select required value={d} onChange={e => emit(y, m, e.target.value)} className={base} aria-label="Day">
        <option value="" disabled>Day</option>
        {days.map(dd => <option key={dd} value={dd}>{Number(dd)}</option>)}
      </select>
      <select required value={m} onChange={e => emit(y, e.target.value, d)} className={base} aria-label="Month">
        <option value="" disabled>Month</option>
        {DOB_MONTHS.map((name, i) => {
          const mm = String(i + 1).padStart(2, '0')
          return <option key={mm} value={mm}>{name}</option>
        })}
      </select>
      <select required value={y} onChange={e => emit(e.target.value, m, d)} className={base} aria-label="Year">
        <option value="" disabled>Year</option>
        {years.map(yy => <option key={yy} value={yy}>{yy}</option>)}
      </select>
    </div>
  )
}
