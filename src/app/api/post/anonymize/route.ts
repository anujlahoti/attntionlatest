import { anonymizeWithAI } from '@/lib/content'
import { anonymize, checkPost } from '@/lib/safety'
import { demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

export const maxDuration = 60

// One-click anonymise for the "Before you post" card. Uses the AI writer when
// available (natural rewrite) and the rule-based replacements otherwise.
// Shared by the demo and the signed-in app, so it is rate limited like the demo.
export async function POST(request: Request) {
  const limited = await demoRateLimit(request)
  if (limited) return limited

  const { post } = await request.json().catch(() => ({ post: '' }))
  const text = String(post ?? '').slice(0, 4000)
  if (!text.trim()) return NextResponse.json({ error: 'No post' }, { status: 400 })

  const flags = checkPost(text)
  if (!flags.length) return NextResponse.json({ post: text, flags: [], method: 'none' })

  let rewritten = ''
  let method: 'ai' | 'rules' = 'rules'
  try {
    rewritten = await anonymizeWithAI(text, [...new Set(flags.map((f) => f.label))])
    method = 'ai'
  } catch {
    rewritten = ''
  }
  // Trust the AI rewrite only if it actually cleared the high-severity flags.
  if (!rewritten || checkPost(rewritten).some((f) => f.severity === 'high')) {
    rewritten = anonymize(text, flags)
    method = 'rules'
  }
  return NextResponse.json({ post: rewritten, flags: checkPost(rewritten), method })
}
