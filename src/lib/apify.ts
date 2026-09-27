const APIFY_BASE = 'https://api.apify.com/v2'

export async function scrapeLinkedInTopContent(nicheSlug: string): Promise<string[]> {
  try {
    const runResponse = await fetch(
      `${APIFY_BASE}/acts/lexis-solutions~linkedin-top-content-scraper/runs?token=${process.env.APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [`https://www.linkedin.com/pulse/topics/${nicheSlug}/`],
          maxItems: 20,
        }),
      }
    )

    if (!runResponse.ok) return getMockPosts(nicheSlug)
    const run = await runResponse.json()
    const runId = run.data?.id
    if (!runId) return getMockPosts(nicheSlug)

    // Poll for completion
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const statusRes = await fetch(
        `${APIFY_BASE}/actor-runs/${runId}?token=${process.env.APIFY_API_TOKEN}`
      )
      const status = await statusRes.json()
      if (status.data?.status === 'SUCCEEDED') break
      if (status.data?.status === 'FAILED') return getMockPosts(nicheSlug)
    }

    const dataRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${process.env.APIFY_API_TOKEN}&limit=20`
    )
    const items: { text?: string; content?: string }[] = await dataRes.json()
    return items.map((item) => item.text || item.content || '').filter(Boolean)
  } catch {
    return getMockPosts(nicheSlug)
  }
}

function getMockPosts(niche: string): string[] {
  return [
    `I failed my first startup. Here is what I learned that nobody tells you. [mock post for ${niche} niche]`,
    `3 years ago I had 0 followers. Here is the exact content strategy that changed everything.`,
    `Unpopular opinion: most founders are building the wrong product. Here is why.`,
    `I just closed a deal that took 14 months. Here is every mistake I made along the way.`,
    `The best advice I ever got: stop optimizing what does not matter yet.`,
  ]
}
