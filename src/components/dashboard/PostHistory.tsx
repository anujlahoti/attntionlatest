import Card from '@/components/ui/Card'
import AnalyticsCard from './AnalyticsCard'
import { WeeklySession, PostAnalytics } from '@/types'

export default function PostHistory({
  session,
  analytics,
}: {
  session: WeeklySession
  analytics?: PostAnalytics | null
}) {
  const text = session.final_post || session.draft_post || ''
  const snippet = text.length > 140 ? `${text.slice(0, 140)}…` : text
  const date = new Date(session.week_of).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{date}</span>
        <AnalyticsCard analytics={analytics} />
      </div>
      <p className="mt-3 text-sm text-zinc-300 whitespace-pre-line">
        {snippet || 'No post text yet.'}
      </p>
    </Card>
  )
}
