import { createClient } from '@/lib/supabase/server'
import { generateLinkedInPost } from '@/lib/content'
import { writePreviewPost } from '@/lib/preview-writer'
import { NextResponse } from 'next/server'

export const maxDuration = 60

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
    supabase.from('weekly_sessions').select('*').eq('id', sessionId).single(),
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

  try {
    const draftPost = await generateLinkedInPost({
      transcript: session.transcript,
      winningFormat: intel?.winning_format || 'story',
      winningHook: intel?.winning_hook || 'opens with a specific moment',
      niche: profile.niche,
      profession: profile.profession,
      brandContext: profile.brand_context || {},
      goals: profile.goals || [],
    })

    await supabase.from('weekly_sessions')
      .update({ draft_post: draftPost, status: 'drafted' })
      .eq('id', sessionId)

    return NextResponse.json({ draftPost })
  } catch (err) {
    // AI is down (no key, no credits): hand back a preview built from their own words.
    console.error('Post generation failed, using preview writer', err)
    const draftPost = writePreviewPost(session.transcript, profile.goals || [])
    await supabase.from('weekly_sessions')
      .update({ draft_post: draftPost, status: 'drafted' })
      .eq('id', sessionId)
    return NextResponse.json({ draftPost, preview: true })
  }
}
