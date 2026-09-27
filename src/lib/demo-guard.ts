import { NICHE_MAP, BrandContext } from '@/types'
import { DEEP_PROFILE_FIELDS, PersonContextInput } from './profile'
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

// Demo requests carry the visitor's profile from the browser. Keep only known
// fields, as short strings, before they go anywhere near a prompt.
export function demoProfile(raw: unknown): PersonContextInput & { linkedin_niche_slug: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const str = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)
  const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 3).map((x) => String(x).slice(0, 80)) : undefined)

  const profession = str(body.profession) ?? 'Startup Founder'
  const niche = profession in NICHE_MAP ? profession : 'Startup Founder'
  const profile: PersonContextInput & { linkedin_niche_slug: string } = {
    full_name: str(body.name ?? body.full_name, 80),
    profession,
    niche,
    linkedin_niche_slug: NICHE_MAP[niche],
    goals: list(body.goals),
    brand_context: body.brandContext && typeof body.brandContext === 'object' ? (body.brandContext as BrandContext) : undefined,
  }
  for (const field of DEEP_PROFILE_FIELDS) {
    const value = Array.isArray(body[field]) ? list(body[field]) : str(body[field])
    if (value !== undefined) (profile as unknown as Record<string, unknown>)[field] = value
  }
  return profile
}
