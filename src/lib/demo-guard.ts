import { NextResponse } from 'next/server'

// The /api/demo/* routes run without an account, so cap how often one visitor
// can hit the paid AI APIs. In-memory and per-instance: a speed bump, not a wall.
const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 40
const hits = new Map<string, number[]>()

export function demoRateLimit(request: Request): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Demo limit reached for this hour. Sign in to keep going.' },
      { status: 429 }
    )
  }
  recent.push(now)
  hits.set(ip, recent)
  return null
}
