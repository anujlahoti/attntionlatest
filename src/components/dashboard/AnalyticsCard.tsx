import { PostAnalytics } from '@/types'

export default function AnalyticsCard({ analytics }: { analytics?: PostAnalytics | null }) {
  if (!analytics) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
      {analytics.impressions.toLocaleString()} impressions
    </span>
  )
}
