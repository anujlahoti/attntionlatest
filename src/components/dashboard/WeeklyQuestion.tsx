import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import MuseFace from '@/components/ui/MuseFace'
import { Plane } from '@/components/ui/Art'
import { WeeklySession } from '@/types'

const STATUS_COPY: Record<WeeklySession['status'], { label: string; cta: string }> = {
  pending: { label: 'Awaiting your voice note', cta: 'Answer now' },
  transcribed: { label: 'Answer captured', cta: 'Paint my post' },
  drafted: { label: 'Draft on the easel', cta: 'Review & post' },
  published: { label: 'Hung on the wall', cta: 'See this week' },
  failed: { label: 'Something went wrong', cta: 'Try again' },
}

export default function WeeklyQuestion({
  session,
  winningFormat,
}: {
  session: WeeklySession | null
  winningFormat?: string
}) {
  if (!session) {
    return (
      <div className="relative overflow-hidden bg-rose border-2 border-ink cut p-7 sm:p-9 shadow-ink">
        <Plane shape="quarter" color="#e9b23c" size={170} rotate={90} className="absolute -right-8 -bottom-8" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <MuseFace size={110} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]">This week</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">Your question is waiting to be written.</p>
            <p className="mt-2 text-ink-soft">I&apos;ll study your niche and ask you one thing. About twenty seconds.</p>
            <Link href="/session" className={buttonClasses('primary', 'lg', 'mt-6')}>
              Get this week&apos;s question →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status = STATUS_COPY[session.status] ?? STATUS_COPY.pending
  const isPublished = session.status === 'published'

  return (
    <div className="relative overflow-hidden bg-cobalt text-paper border-2 border-ink cut p-7 sm:p-10 shadow-ink">
      <Plane shape="circle" color="#e9b23c" size={180} className="absolute -right-12 -top-12" />
      <Plane shape="triangle" color="#eba59c" size={90} rotate={20} className="absolute right-16 bottom-4 hidden sm:block" />
      <div className="relative max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isPublished ? 'olive' : 'paper'}>{status.label}</Badge>
          {winningFormat && !isPublished && <Badge tone="ochre">{winningFormat} is winning</Badge>}
        </div>
        {isPublished ? (
          <p className="mt-6 text-paper/90 whitespace-pre-line line-clamp-5">{session.final_post}</p>
        ) : (
          <p className="mt-6 font-display text-3xl sm:text-[40px] leading-[1.1] font-semibold tracking-tight">
            {session.question}
          </p>
        )}
        <Link href="/session" className={buttonClasses(isPublished ? 'secondary' : 'accent', 'lg', 'mt-8')}>
          {status.cta} →
        </Link>
      </div>
    </div>
  )
}
