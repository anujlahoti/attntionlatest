import { draftPost } from '@/lib/drafting'
import { demoProfile, demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(request: Request) {
  const limited = demoRateLimit(request)
  if (limited) return limited

  const body = await request.json()
  const transcript = String(body.transcript || '').slice(0, 6000)
  if (transcript.trim().length < 20) {
    return NextResponse.json({ error: 'Tell Muse a little more first' }, { status: 400 })
  }

  const { post, preview } = await draftPost(
    transcript,
    {
      winning_format: String(body.winningFormat || 'personal story with a lesson').slice(0, 300),
      winning_hook: String(body.winningHook || 'opens with a specific moment').slice(0, 300),
      topic_clusters: Array.isArray(body.topicClusters) ? body.topicClusters.slice(0, 5).map(String) : [],
    },
    demoProfile(body)
  )
  return NextResponse.json({ draftPost: post, preview })
}
