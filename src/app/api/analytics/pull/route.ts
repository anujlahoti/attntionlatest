import { createClient } from '@/lib/supabase/server'
import { getPostAnalytics } from '@/lib/blotato'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.BLOTATO_API_KEY) return NextResponse.json({ pulled: 0 })

  const { data: sessions } = await supabase
    .from('weekly_sessions')
    .select('id, linkedin_post_id')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .not('linkedin_post_id', 'is', null)

  if (!sessions?.length) return NextResponse.json({ pulled: 0 })

  let pulled = 0
  for (const session of sessions) {
    try {
      const stats = await getPostAnalytics(session.linkedin_post_id!)
      await supabase.from('post_analytics').insert({
        session_id: session.id,
        ...stats,
      })
      pulled++
    } catch {
      // Skip sessions Blotato can't report on yet
    }
  }

  return NextResponse.json({ pulled })
}
