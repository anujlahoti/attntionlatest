import { buildWeeklyIntelligence } from '@/lib/intelligence'
import { personalQuestion } from '@/lib/drafting'
import { demoProfile, demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const limited = demoRateLimit(request)
  if (limited) return limited

  const profile = demoProfile(await request.json())
  const intel = await buildWeeklyIntelligence(profile.niche!, profile.linkedin_niche_slug)
  const question = await personalQuestion(intel, profile)

  return NextResponse.json({
    question,
    winningFormat: intel.winning_format,
    winningHook: intel.winning_hook,
    topicClusters: intel.topic_clusters,
    insight: intel.insight_summary,
  })
}
