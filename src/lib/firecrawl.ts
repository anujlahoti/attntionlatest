import { BrandContext } from '@/types'
import { extractBrandFromText } from './content'

export async function extractBrandContext(websiteUrl: string): Promise<BrandContext> {
  const url = /^https?:\/\//.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`
  if (process.env.FIRECRAWL_API_KEY) {
    const viaFirecrawl = await extractWithFirecrawl(url)
    if (viaFirecrawl.tone) return viaFirecrawl
  }
  return extractDirectly(url)
}

async function extractWithFirecrawl(url: string): Promise<BrandContext> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
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

// Fallback without Firecrawl: fetch the homepage ourselves and let the AI read it.
async function extractDirectly(url: string): Promise<BrandContext> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AttntionBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return {}
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000)
    if (text.length < 80) return {}
    return await extractBrandFromText(text)
  } catch {
    return {}
  }
}
