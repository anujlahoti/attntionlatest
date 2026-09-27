import { ReactNode } from 'react'
import Logo from '@/components/ui/Logo'
import MuseFace from '@/components/ui/MuseFace'
import Progress from '@/components/ui/Progress'
import { Plane } from '@/components/ui/Art'

const NUMERALS = ['I', 'II', 'III', 'IV']

// Each step gets its own colour plane and a line from the muse.
const PANELS = [
  { bg: 'bg-rose', note: 'Every portrait starts with a sitting. Tell me who I am painting.' },
  { bg: 'bg-ochre', note: 'A painting needs a purpose. What should your posts do for you?' },
  { bg: 'bg-cobalt text-paper', note: 'Your words, your colours. Show me where your brand lives.' },
]

export default function OnboardingShell({
  step,
  total = 3,
  title,
  subtitle,
  thinking = false,
  children,
}: {
  step: number
  total?: number
  title: string
  subtitle?: string
  thinking?: boolean
  children: ReactNode
}) {
  const panel = PANELS[(step - 1) % PANELS.length]
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* The muse's side of the canvas */}
      <aside className={`relative hidden lg:flex flex-col justify-between overflow-hidden border-r-2 border-ink p-10 ${panel.bg}`}>
        <Logo />
        <Plane shape="quarter" color="#fbf8f1" size={220} rotate={90} className="absolute -right-10 top-24 opacity-90" />
        <Plane shape="triangle" color="#5f7a4f" size={110} rotate={-12} className="absolute left-10 bottom-40" />
        <div className="relative">
          <MuseFace size={200} state={thinking ? 'thinking' : 'idle'} />
          <p className="mt-8 max-w-sm font-display text-3xl leading-tight italic">&ldquo;{panel.note}&rdquo;</p>
        </div>
        <p className="relative text-xs font-bold uppercase tracking-[0.16em]">
          Sitting {NUMERALS[step - 1]} of {NUMERALS[total - 1]}
        </p>
      </aside>

      <main className="flex flex-col px-4 sm:px-10 py-6 lg:py-10">
        <div className="lg:hidden flex items-center justify-between">
          <Logo />
          <MuseFace size={40} state={thinking ? 'thinking' : 'idle'} />
        </div>
        <div className="flex-1 flex items-start lg:items-center">
          <div className="w-full max-w-xl mx-auto py-8">
            <Progress step={step} total={total} />
            <div key={step} className="mt-10 fade-up">
              <p className="font-display italic text-terracotta text-lg">{NUMERALS[step - 1]}.</p>
              <h1 className="mt-1 font-display text-4xl sm:text-[44px] leading-[1.05] font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-3 text-muted text-lg">{subtitle}</p>}
              <div className="mt-9">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
