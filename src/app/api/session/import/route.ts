import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Brings a draft made in the no-account demo into the user's first real session,
// so "Save my progress with an account" actually saves it.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, question, transcript, draft } = await request.json()
  const { data: session } = await supabase
    .from('weekly_sessions')
    .select('id, transcript, draft_post, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Never overwrite work already done in the account.
  if (session.transcript || session.draft_post || session.status === 'published') {
    return NextResponse.json({ imported: false })
  }

  await supabase
    .from('weekly_sessions')
    .update({
      ...(question ? { question: String(question).slice(0, 500) } : {}),
      transcript: String(transcript ?? '').slice(0, 6000) || null,
      draft_post: String(draft ?? '').slice(0, 3000) || null,
      status: draft ? 'drafted' : transcript ? 'transcribed' : 'pending',
    })
    .eq('id', sessionId)

  return NextResponse.json({ imported: true })
}
