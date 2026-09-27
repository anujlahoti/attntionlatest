import { createAdminClient } from '@/lib/supabase/admin'
import { ensureNicheIntelligence, ensureWeeklySession } from '@/lib/weekly'
import { getPostAnalytics } from '@/lib/blotato'
import { NextResponse } from 'next/server'

export const maxDuration = 300

// Runs from Vercel Cron (see vercel.json). Prepares this week's question for every
// onboarded user (one scrape per niche, shared) and refreshes post analytics.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: users } = await admin
    .from('users')
    .select('id, niche, linkedin_niche_slug, goals')
    .eq('onboarding_complete', true)

  const byNiche = new Map<string, { slug: string; goals: string[]; ids: string[] }>()
  for (const u of users ?? []) {
    const niche = u.niche || 'Startup Founder'
    const entry = byNiche.get(niche) ?? { slug: u.linkedin_niche_slug || 'entrepreneurship', goals: u.goals || [], ids: [] as string[] }
    entry.ids.push(u.id)
    byNiche.set(niche, entry)
  }

  let sessionsPrepared = 0
  for (const [niche, { slug, goals, ids }] of byNiche) {
    try {
      const intel = await ensureNicheIntelligence(admin, niche, slug, goals)
      for (const id of ids) {
        await ensureWeeklySession(admin, id, intel.generated_question)
        sessionsPrepared++
      }
    } catch (err) {
      console.error(`Weekly prep failed for niche ${niche}`, err)
    }
  }

  let analyticsPulled = 0
  if (process.env.BLOTATO_API_KEY) {
    const { data: published } = await admin
      .from('weekly_sessions')
      .select('id, linkedin_post_id')
      .eq('status', 'published')
      .not('linkedin_post_id', 'is', null)
      .gte('published_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    for (const s of published ?? []) {
      try {
        await admin.from('post_analytics').insert({ session_id: s.id, ...(await getPostAnalytics(s.linkedin_post_id)) })
        analyticsPulled++
      } catch {
        // Blotato may not have stats for very new posts yet
      }
    }
  }

  return NextResponse.json({ niches: byNiche.size, sessionsPrepared, analyticsPulled })
}
