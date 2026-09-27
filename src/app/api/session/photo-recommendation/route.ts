import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recommendPhoto } from '@/lib/drafting'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const { data: session } = await supabase
    .from('weekly_sessions')
    .select('draft_post, final_post')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  const post = session?.final_post || session?.draft_post
  if (!post) return NextResponse.json({ error: 'No draft post yet' }, { status: 400 })

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  return NextResponse.json(await recommendPhoto(post, profile ?? {}))
}
