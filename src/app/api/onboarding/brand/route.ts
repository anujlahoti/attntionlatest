import { createClient } from '@/lib/supabase/server'
import { extractBrandContext } from '@/lib/firecrawl'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  const { websiteUrl } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brandContext = websiteUrl ? await extractBrandContext(websiteUrl) : {}
  await supabase.from('users').update({
    website_url: websiteUrl,
    brand_context: brandContext,
    onboarding_complete: true,
  }).eq('id', user.id)

  return NextResponse.json({ brandContext })
}
