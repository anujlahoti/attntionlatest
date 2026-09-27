import { recommendPhoto } from '@/lib/drafting'
import { demoProfile, demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  const limited = demoRateLimit(request)
  if (limited) return limited

  const body = await request.json()
  const post = String(body.post || '').slice(0, 4000)
  if (!post.trim()) return NextResponse.json({ error: 'No draft post yet' }, { status: 400 })

  return NextResponse.json(await recommendPhoto(post, demoProfile(body)))
}
