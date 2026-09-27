// Decorative pieces for the Atelier look. All aria-hidden: pure ornament.

type Shape = 'quarter' | 'triangle' | 'half' | 'square' | 'circle' | 'eye'

const PATHS: Record<Shape, string> = {
  quarter: 'M0 100 L0 0 A100 100 0 0 1 100 100 Z',
  triangle: 'M50 4 L96 96 L4 96 Z',
  half: 'M0 70 A50 50 0 0 1 100 70 Z',
  square: 'M8 8 L92 8 L92 92 L8 92 Z',
  circle: 'M50 6 A44 44 0 1 1 49.9 6 Z',
  eye: 'M6 50 Q50 6 94 50 Q50 94 6 50 Z',
}

export function Plane({
  shape,
  color,
  size = 80,
  rotate = 0,
  className = '',
}: {
  shape: Shape
  color: string
  size?: number
  rotate?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`pointer-events-none ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <path d={PATHS[shape]} fill={color} stroke="#17150f" strokeWidth={3} strokeLinejoin="round" />
      {shape === 'eye' && <circle cx="50" cy="50" r="12" fill="#17150f" />}
    </svg>
  )
}

// A single continuous line, drawn in on load. The dove is a nod to Picasso's 1949 dove.
export function LineDove({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={`draw-line ${className}`} fill="none" aria-hidden>
      <path
        d="M18 150 C60 150 92 132 120 108 C140 90 150 70 176 62 C196 56 214 62 222 74 C228 60 240 52 256 54 C246 60 240 68 238 78 C250 76 262 80 268 88 C252 88 240 92 232 100 C222 128 196 150 160 158 C132 164 104 160 84 170 C104 150 128 140 150 128 C124 132 96 126 76 112 C104 114 128 108 148 96 C170 82 186 70 206 70"
        stroke="#17150f"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="232" cy="72" r="3.5" fill="#17150f" />
    </svg>
  )
}

export function Squiggle({ className = '', color = '#d4553a' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 240 24" className={`draw-line ${className}`} fill="none" aria-hidden preserveAspectRatio="none">
      <path d="M4 14 C28 2 52 24 78 12 S126 2 150 14 S204 24 236 8" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </svg>
  )
}

// Gallery-style label: "Plate III — The Sitting"
export function Placard({ numeral, children, className = '' }: { numeral?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft ${className}`}>
      {numeral && <span className="font-display text-sm italic normal-case tracking-normal text-terracotta">{numeral}</span>}
      <span className="h-px w-6 bg-ink" />
      {children}
    </p>
  )
}
