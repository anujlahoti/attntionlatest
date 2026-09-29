import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent } from '@/lib/events'
import { NextRequest, NextResponse } from 'next/server'

// Tracked redirect for email links: /api/r?e=email_click&u=<user id>&to=/session
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const to = params.get('to') ?? '/'
  // Only same-site paths, never an open redirect.
  const safeTo = /^\/(?!\/)[\w\-/?=&.]*$/.test(to) ? to : '/'

  const userId = params.get('u')
  if (params.get('e') === 'email_click' && userId && /^[0-9a-f-]{36}$/i.test(userId)) {
    await trackEvent(createAdminClient(), userId, 'email_click')
  }
  return NextResponse.redirect(new URL(safeTo, request.url))
}
