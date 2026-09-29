import { createAdminClient } from '@/lib/supabase/admin'
import { prepareUserWeek, prewarmNiches, WeekProfile } from '@/lib/weekly'
import { emailConfigured, sendWeeklyReminder } from '@/lib/notify'
import { trackEvent } from '@/lib/events'
import { getPostAnalytics } from '@/lib/blotato'
import { currentWeekOf } from '@/lib/week'
import { NextResponse } from 'next/server'

export const maxDuration = 300

const CONCURRENCY = 20

// Run `fn` over `items`, at most `limit` at a time.
async function inBatches<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += limit) {
    await Promise.allSettled(items.slice(i, i + limit).map(fn))
  }
}

// Runs from Vercel Cron (see vercel.json) early Monday. 1) Builds every niche's
// study once. 2) Writes each onboarded user their personal question, 20 users
// at a time (idempotent: users who already have this week's session are skipped).
// 3) Emails the question. 4) Refreshes post analytics and trims demo rate-limit rows.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const nichesReady = await prewarmNiches(admin)

  const { data: users } = await admin.from('users').select('*').eq('onboarding_complete', true)
  const lastWeek = new Date(`${currentWeekOf()}T00:00:00Z`)
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7)

  let sessionsPrepared = 0
  let emailsSent = 0
  let failures = 0
  await inBatches((users ?? []) as (WeekProfile & { email?: string })[], CONCURRENCY, async (u) => {
    try {
      const result = await prepareUserWeek(admin, admin, u)
      if (!result.created) return
      sessionsPrepared++

      if (emailConfigured() && u.email && result.question) {
        const { data: prev } = await admin
          .from('weekly_sessions')
          .select('id, post_analytics(impressions, reactions, comments, pulled_at)')
          .eq('user_id', u.id)
          .eq('week_of', lastWeek.toISOString().split('T')[0])
          .maybeSingle()
        const stats = (prev?.post_analytics as { impressions: number; reactions: number; comments: number }[] | undefined)?.[0]
        await sendWeeklyReminder({ id: u.id, email: u.email, name: u.full_name }, result.question, stats ?? null)
        emailsSent++
        await trackEvent(admin, u.id, 'email_sent')
      }
    } catch (err) {
      failures++
      console.error(`Weekly prep failed for user ${u.id}`, err)
    }
  })

  let analyticsPulled = 0
  if (process.env.BLOTATO_API_KEY) {
    const { data: published } = await admin
      .from('weekly_sessions')
      .select('id, linkedin_post_id')
      .eq('status', 'published')
      .not('linkedin_post_id', 'is', null)
      .gte('published_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    await inBatches(published ?? [], CONCURRENCY, async (s) => {
      try {
        await admin.from('post_analytics').insert({ session_id: s.id, ...(await getPostAnalytics(s.linkedin_post_id)) })
        analyticsPulled++
      } catch {
        // Blotato may not have stats for very new posts yet
      }
    })
  }

  // Demo rate-limit rows only matter for a day.
  await admin.from('demo_hits').delete().lt('created_at', new Date(Date.now() - 2 * 86_400_000).toISOString())

  return NextResponse.json({ nichesReady, users: users?.length ?? 0, sessionsPrepared, emailsSent, failures, analyticsPulled })
}
