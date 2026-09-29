import { ensureNicheIntelligence } from '@/lib/weekly'
import { personalQuestion } from '@/lib/drafting'
import { demoProfile, demoRateLimit } from '@/lib/demo-guard'
import { resolveNiche } from '@/lib/niches'
import { supabaseConfigured } from '@/lib/supabase/env'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const limited = await demoRateLimit(request)
  if (limited) return limited

  const body = await request.json()
  const profile = demoProfile(body)
  const niche = resolveNiche(profile)
  // The same cached weekly study signed-in users get: no scrape per visitor.
  const admin = supabaseConfigured && process.env.SUPABASE_SECRET_KEY ? createAdminClient() : null
  const intel = await ensureNicheIntelligence(admin, niche)
  const variant = Math.max(0, Math.min(3, Number(body.variant) || 0))
  const question = await personalQuestion(intel, profile, niche, variant, typeof body.previous === 'string' ? body.previous : undefined)

  return NextResponse.json({
    question,
    niche: niche.key,
    winningFormat: intel.winning_format,
    winningHook: intel.winning_hook,
    topicClusters: intel.topic_clusters,
    insight: intel.insight_summary,
    dataSource: intel.data_source ?? null,
  })
}
