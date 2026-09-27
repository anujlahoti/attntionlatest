import Badge from '@/components/ui/Badge'
import AnalyticsCard from './AnalyticsCard'
import { WeeklySession, PostAnalytics } from '@/types'

const FRAMES = ['bg-rose', 'bg-ochre', 'bg-paper-deep', 'bg-cobalt']

// A past week, hung like a small framed canvas.
export default function PostHistory({
  session,
  analytics,
  index = 0,
}: {
  session: WeeklySession
  analytics?: PostAnalytics | null
  index?: number
}) {
  const text = session.final_post || session.draft_post || session.question || ''
  const date = new Date(session.week_of).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
  const published = session.status === 'published'

  return (
    <article className={`${FRAMES[index % FRAMES.length]} border-2 border-ink p-2.5 ${index % 2 ? 'cut-alt' : 'cut'}`}>
      <div className="bg-surface border-2 border-ink h-full p-5 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Week of {date}</span>
          <Badge tone={published ? 'olive' : 'paper'}>{published ? 'Posted' : 'Not posted'}</Badge>
        </div>
        <p className="mt-3 text-sm text-ink-soft whitespace-pre-line line-clamp-5 flex-1">{text || 'No post text yet.'}</p>
        <AnalyticsCard analytics={analytics} />
      </div>
    </article>
  )
}
