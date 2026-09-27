import { createClient } from '@/lib/supabase/server'
import { generateLinkedInPost } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await request.json()

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
    .single()

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
}
