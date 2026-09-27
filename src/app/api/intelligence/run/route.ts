import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureNicheIntelligence, ensureWeeklySession } from '@/lib/weekly'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const intelligence = await ensureNicheIntelligence(
    createAdminClient(),
    profile.niche || 'Startup Founder',
    profile.linkedin_niche_slug || 'entrepreneurship',
    profile.goals || []
  )
  await ensureWeeklySession(supabase, user.id, intelligence.generated_question)

  return NextResponse.json({ intelligence })
}
