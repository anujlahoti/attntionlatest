import { createClient } from '@/lib/supabase/server'
import { followUpFor } from '@/lib/drafting'
import { trackEvent } from '@/lib/events'
import { NextResponse } from 'next/server'

export const maxDuration = 60

// Should the muse ask one follow-up before drafting? (Thin or off-topic answers.)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, answer } = await request.json()
  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase.from('weekly_sessions').select('question').eq('id', sessionId).eq('user_id', user.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ])
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const followUp = await followUpFor(session.question ?? '', String(answer ?? '').slice(0, 6000), profile ?? {})
  if (followUp.needed) await trackEvent(supabase, user.id, 'follow_up_asked', { reason: followUp.reason })
  return NextResponse.json(followUp)
}
