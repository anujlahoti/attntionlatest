import { ReactNode } from 'react'
import MuseFace, { MuseState } from '@/components/ui/MuseFace'

export function MuseBubble({
  children,
  state = 'idle',
  label = 'Your muse',
}: {
  children: ReactNode
  state?: MuseState
  label?: string
}) {
  return (
    <div className="flex items-start gap-3 fade-up">
      <MuseFace size={44} state={state} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted mb-1.5">{label}</p>
        <div className="canvas-card px-5 py-4 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end fade-up">
      <div className="max-w-[88%] bg-cobalt text-paper border-2 border-ink cut-alt shadow-ink-sm px-5 py-4 leading-relaxed whitespace-pre-line">
        {children}
      </div>
    </div>
  )
}

export function Typing() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1" aria-label="Thinking">
      <span className="typing-dot h-2.5 w-2.5 bg-ochre border-[1.5px] border-ink" />
      <span className="typing-dot h-2.5 w-2.5 rounded-full bg-rose border-[1.5px] border-ink [animation-delay:0.15s]" />
      <span className="typing-dot h-2.5 w-2.5 rotate-45 bg-cobalt border-[1.5px] border-ink [animation-delay:0.3s]" />
    </span>
  )
}

export function Waveform({ bars = 26, className = '' }: { bars?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[3px] h-7 ${className}`} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="w-[3px] bg-current"
          style={{ height: `${30 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70)}%` }}
        />
      ))}
    </span>
  )
}
