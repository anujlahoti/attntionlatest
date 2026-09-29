import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { personalQuestion } from '@/lib/drafting'
import { ensureNicheIntelligence } from '@/lib/weekly'
import { resolveNiche } from '@/lib/niches'
import { trackEvent } from '@/lib/events'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const MAX_SWAPS = 3

// "Give me a different question" — up to MAX_SWAPS times a week.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, swapsUsed: clientSwaps } = await request.json()
  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase.from('weekly_sessions').select('*').eq('id', sessionId).eq('user_id', user.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ])
  if (!session || !profile) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // question_swaps comes from patch-003; before it runs, trust the client's count.
  const used = typeof session.question_swaps === 'number' ? session.question_swaps : Number(clientSwaps) || 0
  if (used >= MAX_SWAPS) return NextResponse.json({ error: 'You have swapped 3 times this week.' }, { status: 429 })

  const niche = resolveNiche(profile)
  const intel = await ensureNicheIntelligence(createAdminClient(), niche)
  const question = await personalQuestion(intel, profile, niche, used + 1, session.question ?? undefined)

  const update: Record<string, unknown> = { question }
  if (typeof session.question_swaps === 'number') update.question_swaps = used + 1
  await supabase.from('weekly_sessions').update(update).eq('id', sessionId)
  await trackEvent(supabase, user.id, 'question_swapped', { swaps: used + 1 })

  return NextResponse.json({ question, swapsUsed: used + 1, swapsLeft: MAX_SWAPS - used - 1 })
}
