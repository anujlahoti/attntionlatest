import { followUpFor } from '@/lib/drafting'
import { demoProfile, demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  const limited = await demoRateLimit(request)
  if (limited) return limited

  const body = await request.json()
  const followUp = await followUpFor(
    String(body.question ?? '').slice(0, 500),
    String(body.answer ?? '').slice(0, 6000),
    demoProfile(body)
  )
  return NextResponse.json(followUp)
}
