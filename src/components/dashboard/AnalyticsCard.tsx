import { PostAnalytics } from '@/types'

export default function AnalyticsCard({ analytics }: { analytics?: PostAnalytics | null }) {
  if (!analytics) return null

  const stats = [
    { label: 'Impressions', value: analytics.impressions },
    { label: 'Reactions', value: analytics.reactions },
    { label: 'Comments', value: analytics.comments },
  ]

  return (
    <div className="mt-4 grid grid-cols-3 gap-2 border-t-2 border-dashed border-ink/25 pt-3">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="font-display text-lg font-semibold tabular-nums">{s.value.toLocaleString()}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
