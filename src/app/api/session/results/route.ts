import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/events'
import { NextResponse } from 'next/server'

const toCount = (v: unknown) => Math.max(0, Math.min(10_000_000, Math.round(Number(v) || 0)))

// The results loop without Blotato: users log their post link and, a few days
// later, the numbers LinkedIn shows them.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, postUrl, impressions, reactions, comments } = await request.json()
  const { data: session } = await supabase.from('weekly_sessions').select('id').eq('id', sessionId).eq('user_id', user.id).single()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  if (typeof postUrl === 'string' && /^https:\/\/(www\.)?linkedin\.com\//.test(postUrl.trim())) {
    // post_url comes from patch-003; ignore the error if it isn't applied yet.
    await supabase.from('weekly_sessions').update({ post_url: postUrl.trim().slice(0, 500) }).eq('id', sessionId)
  }

  if (impressions != null || reactions != null || comments != null) {
    const { error } = await supabase.from('post_analytics').insert({
      session_id: sessionId,
      impressions: toCount(impressions),
      reactions: toCount(reactions),
      comments: toCount(comments),
      reposts: 0,
    })
    if (error) return NextResponse.json({ error: 'Could not save your results' }, { status: 500 })
    await trackEvent(supabase, user.id, 'results_logged')
  }

  return NextResponse.json({ ok: true })
}
