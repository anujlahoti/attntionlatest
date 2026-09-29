import { BrandContext } from '@/types'
import { DEEP_PROFILE_FIELDS, PersonContextInput } from './profile'
import { resolveNiche } from './niches'
import { supabaseConfigured } from './supabase/env'
import { createAdminClient } from './supabase/admin'
import { NextResponse } from 'next/server'

// The /api/demo/* routes run without an account, so cap how often one visitor
// can hit the paid APIs, plus a global daily cap on demo spend. Counts live in
// Supabase (demo_hits, patch-003) so the limit holds across serverless
// instances; without that table it falls back to a per-instance memory limit.
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_IP = 40
const DAILY_CAP = Number(process.env.DEMO_DAILY_CAP || 1500)
const memoryHits = new Map<string, number[]>()

function clientIp(request: Request) {
  // On Vercel, x-forwarded-for is set by the platform, so the first entry is the client.
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
}

function limited(message: string) {
  return NextResponse.json({ error: message }, { status: 429 })
}

function memoryLimit(ip: string): NextResponse | null {
  const now = Date.now()
  const recent = (memoryHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_IP) return limited('Demo limit reached for this hour. Sign in to keep going.')
  recent.push(now)
  memoryHits.set(ip, recent)
  return null
}

export async function demoRateLimit(request: Request): Promise<NextResponse | null> {
  const ip = clientIp(request)
  if (!supabaseConfigured || !process.env.SUPABASE_SECRET_KEY) return memoryLimit(ip)

  try {
    const admin = createAdminClient()
    const hourAgo = new Date(Date.now() - WINDOW_MS).toISOString()
    const dayStart = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()
    const [perIp, today] = await Promise.all([
      admin.from('demo_hits').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', hourAgo),
      admin.from('demo_hits').select('id', { count: 'exact', head: true }).gte('created_at', dayStart),
    ])
    if (perIp.error || today.error) return memoryLimit(ip) // table missing: patch-003 not applied
    if ((perIp.count ?? 0) >= MAX_PER_IP) return limited('Demo limit reached for this hour. Sign in to keep going.')
    if ((today.count ?? 0) >= DAILY_CAP) return limited('The demo is very busy today. Create a free account to keep going.')
    await admin.from('demo_hits').insert({ ip })
    return null
  } catch {
    return memoryLimit(ip)
  }
}

// Demo requests carry the visitor's profile from the browser. Keep only known
// fields, as short strings, before they go anywhere near a prompt.
export function demoProfile(raw: unknown): PersonContextInput {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const str = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)
  const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 3).map((x) => String(x).slice(0, 80)) : undefined)

  const profile: PersonContextInput = {
    full_name: str(body.name ?? body.full_name, 80),
    profession: str(body.profession),
    goals: list(body.goals),
    brand_context: body.brandContext && typeof body.brandContext === 'object' ? (body.brandContext as BrandContext) : undefined,
  }
  for (const field of DEEP_PROFILE_FIELDS) {
    const value = Array.isArray(body[field]) ? list(body[field]) : str(body[field])
    if (value !== undefined) (profile as unknown as Record<string, unknown>)[field] = value
  }
  profile.niche = resolveNiche(profile).key
  return profile
}
