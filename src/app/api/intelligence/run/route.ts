import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prepareUserWeek } from '@/lib/weekly'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // select('*') so the deep-profile fields are included once patch-002 is applied,
  // without breaking accounts on a database that doesn't have them yet.
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { intel } = await prepareUserWeek(supabase, createAdminClient(), profile)
  return NextResponse.json({ intelligence: intel })
}
