export interface PostValidation {
  is_valid: boolean
  has_hook: boolean
  has_body: boolean
  has_cta: boolean
  has_hashtags: boolean
  word_count: number
  issues: string[]
}

const CTA_PATTERN = /(\?|dm me|my dms|comment|drop|share|tag|link in bio|let'?s talk|connect|reach out|tell me|hiring)/i

// Checks a draft follows Hook + Content + CTA + Hashtags before it is shown.
export function validatePost(post: string): PostValidation {
  const lines = post.trim().split('\n').filter((l) => l.trim().length > 0)
  const words = post.trim().split(/\s+/).filter((w) => w && !w.startsWith('#'))
  const hashtags = post.match(/#\w+/g) || []
  const issues: string[] = []

  const firstLine = lines[0] || ''
  const hasHook = firstLine.length > 10 && firstLine.length < 200
  if (!hasHook) issues.push('Hook is missing or too long')

  const hasBody = lines.length >= 4
  if (!hasBody) issues.push('Post body is too short, it needs more content')

  // Look for the CTA in the lines before the hashtags, not in the tags themselves.
  const bodyText = lines.filter((l) => !/^(#\w+\s*)+$/.test(l.trim())).join('\n')
  const hasCTA = CTA_PATTERN.test(bodyText)
  if (!hasCTA) issues.push('CTA is missing or unclear')

  const hasHashtags = hashtags.length >= 3 && hashtags.length <= 8
  if (hashtags.length < 3) issues.push('Too few hashtags (need 4-6)')
  if (hashtags.length > 8) issues.push('Too many hashtags (keep to 4-6)')

  const wordCount = words.length
  if (wordCount < 100) issues.push('Post is too short (needs 150-300 words)')
  if (wordCount > 400) issues.push('Post is too long (keep under 350 words)')

  return {
    is_valid: hasHook && hasBody && hasCTA && hasHashtags && wordCount >= 100 && wordCount <= 400,
    has_hook: hasHook,
    has_body: hasBody,
    has_cta: hasCTA,
    has_hashtags: hasHashtags,
    word_count: wordCount,
    issues,
  }
}
