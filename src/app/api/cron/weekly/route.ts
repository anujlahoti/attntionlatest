import { createAdminClient } from '@/lib/supabase/admin'
import { prepareUserWeek } from '@/lib/weekly'
import { getPostAnalytics } from '@/lib/blotato'
import { NextResponse } from 'next/server'

export const maxDuration = 300

// Runs from Vercel Cron (see vercel.json). Prepares this week's question for every
// onboarded user and refreshes post analytics.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: users } = await admin.from('users').select('*').eq('onboarding_complete', true)

  // Niche intelligence is cached per niche, so this scrapes once per niche and
  // then writes each user a personal question.
  const niches = new Set<string>()
  let sessionsPrepared = 0
  for (const u of users ?? []) {
    try {
      await prepareUserWeek(admin, admin, u)
      niches.add(u.niche || 'Startup Founder')
      sessionsPrepared++
    } catch (err) {
      console.error(`Weekly prep failed for user ${u.id}`, err)
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

  return NextResponse.json({ niches: niches.size, sessionsPrepared, analyticsPulled })
}
