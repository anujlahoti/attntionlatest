const BLOTATO_BASE = 'https://backend.blotato.com'

export async function publishToLinkedIn({
  profileId,
  text,
  imageUrl,
  scheduledAt,
}: {
  profileId: string
  text: string
  imageUrl?: string
  scheduledAt?: Date
}) {
  const content: { text: string; mediaUrls?: string[] } = { text }
  if (imageUrl) content.mediaUrls = [imageUrl]

  const post: {
    target: { targetType: string; profileId: string }
    content: typeof content
    scheduledAt?: string
  } = {
    target: { targetType: 'profile', profileId },
    content,
  }
  if (scheduledAt) post.scheduledAt = scheduledAt.toISOString()

  const body = { post }

  const response = await fetch(`${BLOTATO_BASE}/v1/posts`, {
    method: 'POST',
    headers: {
      'api-key': process.env.BLOTATO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Blotato publish failed: ${error}`)
  }

  return response.json()
}

export async function getPostAnalytics(postId: string) {
  const response = await fetch(`${BLOTATO_BASE}/v1/posts/${postId}/analytics`, {
    headers: { 'api-key': process.env.BLOTATO_API_KEY! },
  })

  if (!response.ok) {
    throw new Error(`Blotato analytics fetch failed: ${await response.text()}`)
  }

  const data = await response.json()
  return {
    impressions: data.impressions ?? 0,
    comments: data.comments ?? 0,
    reposts: data.reposts ?? 0,
    reactions: data.reactions ?? 0,
  }
}
