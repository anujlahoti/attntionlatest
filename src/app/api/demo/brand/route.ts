import { extractBrandContext } from '@/lib/firecrawl'
import { demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  const limited = demoRateLimit(request)
  if (limited) return limited

  const { websiteUrl } = await request.json()
  if (!websiteUrl) return NextResponse.json({ brandContext: {} })
  const brandContext = await extractBrandContext(String(websiteUrl))
  return NextResponse.json({ brandContext })
}
