import { createClient } from '@/lib/supabase/server'
import { draftPost } from '@/lib/drafting'
import { trackEvent } from '@/lib/events'
import { resolveNiche } from '@/lib/niches'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // `transcript` is sent when the user typed, edited or extended their answer.
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
    .eq('niche', resolveNiche(profile).key)
    .eq('week_of', session.week_of)
    .maybeSingle()

  const draft = await draftPost(
    session.transcript,
    {
      winning_format: intel?.winning_format || 'personal story with a lesson',
      winning_hook: intel?.winning_hook || 'opens with a specific moment',
      topic_clusters: intel?.topic_clusters || [],
    },
    profile
  )

  await supabase.from('weekly_sessions')
    .update({ draft_post: draft.post, status: 'drafted' })
    .eq('id', sessionId)

  await trackEvent(supabase, user.id, 'draft_shown', { preview: draft.preview, flags: draft.flags.length })
  if (draft.flags.length) await trackEvent(supabase, user.id, 'safety_flagged', { kinds: draft.flags.map((f) => f.kind) })

  return NextResponse.json({ draftPost: draft.post, preview: draft.preview, flags: draft.flags, strategy: draft.strategy })
}
