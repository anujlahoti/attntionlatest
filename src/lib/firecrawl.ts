export async function extractBrandContext(websiteUrl: string) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        formats: ['extract'],
        extract: {
          prompt: 'Extract: 1) the brand tone/voice in 3 words, 2) main topics the brand covers, 3) the tagline or value proposition',
          schema: {
            type: 'object',
            properties: {
              tone: { type: 'string' },
              key_topics: { type: 'array', items: { type: 'string' } },
              tagline: { type: 'string' },
            }
          }
        }
      }),
    })

    if (!response.ok) return {}
    const data = await response.json()
    return data.data?.extract || {}
  } catch {
    return {}
  }
}
