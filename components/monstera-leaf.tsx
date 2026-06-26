export function MonsteraLeaf({ size = 80, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stem */}
      <path
        d="M100 240 C100 240 98 210 100 195 C102 180 100 170 100 170"
        stroke="#004E5C"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main leaf shape with edge splits */}
      <path
        d="M100 10
           C60 10 30 35 22 65
           L35 62
           C30 75 25 90 28 108
           L42 100
           C38 118 40 130 45 148
           L58 138
           C55 152 58 160 65 170
           C75 185 90 188 100 170
           C110 188 125 185 135 170
           C142 160 145 152 142 138
           L155 148
           C160 130 162 118 158 100
           L172 108
           C175 90 170 75 165 62
           L178 65
           C170 35 140 10 100 10Z"
        fill="#006D77"
      />

      {/* Inner holes (fenestrations) */}
      <ellipse cx="60" cy="75" rx="10" ry="14" fill="#FAFAF7" opacity="0.9" transform="rotate(-15 60 75)" />
      <ellipse cx="140" cy="75" rx="10" ry="14" fill="#FAFAF7" opacity="0.9" transform="rotate(15 140 75)" />
      <ellipse cx="55" cy="118" rx="8" ry="12" fill="#FAFAF7" opacity="0.9" transform="rotate(-10 55 118)" />
      <ellipse cx="145" cy="118" rx="8" ry="12" fill="#FAFAF7" opacity="0.9" transform="rotate(10 145 118)" />

      {/* Center vein */}
      <path
        d="M100 18 C100 18 100 60 100 100 C100 140 100 165 100 170"
        stroke="#004E5C"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Side veins - left */}
      <path d="M100 45 C90 48 75 50 55 48" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 70 C88 75 72 80 48 82" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 95 C88 100 72 108 50 112" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 120 C88 126 72 135 55 142" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 145 C90 152 80 160 70 168" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />

      {/* Side veins - right */}
      <path d="M100 45 C110 48 125 50 145 48" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 70 C112 75 128 80 152 82" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 95 C112 100 128 108 150 112" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 120 C112 126 128 135 145 142" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M100 145 C110 152 120 160 130 168" stroke="#004E5C" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />

      {/* Subtle highlight on left side */}
      <path
        d="M100 15 C70 18 42 40 32 65 C28 78 30 95 35 108 C40 122 48 135 55 148 C62 158 75 170 90 172 C95 172 98 170 100 168"
        fill="#E0EEF0"
        opacity="0.15"
      />
    </svg>
  )
}
