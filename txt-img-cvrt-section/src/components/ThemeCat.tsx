export function ThemeCat({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" role="img" aria-label="A small illustrated cat" focusable="false">
      <path d="M20 94 Q15 62 34 50 L30 24 L44 32 L52 18 L62 30 L72 18 L80 32 L94 24 L90 50 Q109 62 104 94 Z" fill="#14245C" />
      <path d="M36 30 L40 20 L48 28 Z" fill="#FF3F70" />
      <path d="M84 30 L80 20 L72 28 Z" fill="#FF3F70" />
      <path d="M100 86 Q118 80 112 58" stroke="#FF8552" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="45" r="4.5" fill="#F2F5FA" />
      <circle cx="72" cy="45" r="4.5" fill="#F2F5FA" />
      <circle cx="48" cy="45" r="2" fill="#14245C" />
      <circle cx="72" cy="45" r="2" fill="#14245C" />
      <path d="M57 54 L63 54 L60 59 Z" fill="#FF3F70" />
      <path d="M52 66 Q60 58 68 66 Q70 80 60 86 Q50 80 52 66 Z" fill="#FFD447" />
      <path d="M34 52 L20 49 M34 58 L21 60 M86 52 L100 49 M86 58 L99 60" stroke="#F2F5FA" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
