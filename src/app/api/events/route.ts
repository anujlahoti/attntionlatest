import { createClient } from '@/lib/supabase/server'
import { EVENT_NAMES, EventName, trackEvent } from '@/lib/events'
import { NextResponse } from 'next/server'

// Client-side product events for signed-in users (demo visitors are not tracked).
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { name, props } = await request.json().catch(() => ({}))
  if (!EVENT_NAMES.includes(name)) return NextResponse.json({ error: 'Unknown event' }, { status: 400 })

  await trackEvent(supabase, user.id, name as EventName, props && typeof props === 'object' ? props : {})
  return NextResponse.json({ ok: true })
}
