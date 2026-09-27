import { buildWeeklyIntelligence } from '@/lib/intelligence'
import { demoRateLimit } from '@/lib/demo-guard'
import { NICHE_MAP } from '@/types'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const limited = demoRateLimit(request)
  if (limited) return limited

  const { profession, goals } = await request.json()
  const niche = typeof profession === 'string' && profession in NICHE_MAP ? profession : 'Startup Founder'
  const intel = await buildWeeklyIntelligence(
    niche,
    NICHE_MAP[niche],
    Array.isArray(goals) ? goals.slice(0, 3).map(String) : []
  )

  return NextResponse.json({
    question: intel.question,
    winningFormat: intel.winning_format,
    winningHook: intel.winning_hook,
    topicClusters: intel.topic_clusters,
    insight: intel.insight,
  })
}
