import { createClient } from '@/lib/supabase/server'
import { draftPost } from '@/lib/drafting'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // `transcript` is sent when the user typed or edited their answer instead of recording.
  const { sessionId, transcript: typedTranscript } = await request.json()
  if (typedTranscript) {
    await supabase.from('weekly_sessions')
      .update({ transcript: typedTranscript, status: 'transcribed' })
      .eq('id', sessionId)
  }

  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase.from('weekly_sessions').select('*').eq('id', sessionId).eq('user_id', user.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ])

  if (!session?.transcript || !profile) {
    return NextResponse.json({ error: 'Missing transcript or profile' }, { status: 400 })
  }

  const { data: intel } = await supabase.from('niche_intelligence')
    .select('*')
    .eq('niche', profile.niche)
    .eq('week_of', session.week_of)
    .maybeSingle()

  const { post, preview } = await draftPost(
    session.transcript,
    {
      winning_format: intel?.winning_format || 'personal story with a lesson',
      winning_hook: intel?.winning_hook || 'opens with a specific moment',
      topic_clusters: intel?.topic_clusters || [],
    },
    profile
  )

  await supabase.from('weekly_sessions')
    .update({ draft_post: post, status: 'drafted' })
    .eq('id', sessionId)

  return NextResponse.json({ draftPost: post, preview })
}
