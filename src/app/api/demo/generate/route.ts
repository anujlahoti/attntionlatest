import { generateLinkedInPost } from '@/lib/content'
import { writePreviewPost } from '@/lib/preview-writer'
import { demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  const limited = demoRateLimit(request)
  if (limited) return limited

  const body = await request.json()
  const goals: string[] = Array.isArray(body.goals) ? body.goals.map(String) : []
  const transcript = String(body.transcript || '').slice(0, 6000)
  if (transcript.trim().length < 20) {
    return NextResponse.json({ error: 'Tell Muse a little more first' }, { status: 400 })
  }

  try {
    const draftPost = await generateLinkedInPost({
      transcript,
      winningFormat: String(body.winningFormat || 'story'),
      winningHook: String(body.winningHook || 'opens with a specific moment'),
      niche: String(body.profession || 'Startup Founder'),
      profession: String(body.profession || 'Startup Founder'),
      brandContext: body.brandContext || {},
      goals,
    })
    return NextResponse.json({ draftPost })
  } catch (err) {
    console.error('Demo post generation failed, using preview writer', err)
    return NextResponse.json({ draftPost: writePreviewPost(transcript, goals), preview: true })
  }
}
