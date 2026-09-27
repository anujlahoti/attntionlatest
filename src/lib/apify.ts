const APIFY_BASE = 'https://api.apify.com/v2'
const ACTOR = 'lexis-solutions~linkedin-top-content-scraper'

export interface ScrapedPost {
  text: string
  reactions: number
  comments: number
  author?: string
}

interface TopContentItem {
  content?: string
  title?: string
  author?: string
  reactions?: number | string
  comments?: number | string
}

function toCount(value: number | string | undefined) {
  if (typeof value === 'number') return value
  const n = parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

// Top posts from linkedin.com/top-content/{topic}/, most-engaged first.
// Falls back to curated samples if Apify is not configured or the run fails.
export async function scrapeLinkedInTopContent(nicheSlug: string): Promise<ScrapedPost[]> {
  if (!process.env.APIFY_API_TOKEN) return getSamplePosts(nicheSlug)

  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/${ACTOR}/run-sync-get-dataset-items?timeout=100&memory=1024`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
        },
        body: JSON.stringify({
          startUrls: [{ url: `https://www.linkedin.com/top-content/${nicheSlug}/` }],
          maxItems: 15,
          proxyConfiguration: { useApifyProxy: true },
        }),
        signal: AbortSignal.timeout(110_000),
      }
    )

    if (!res.ok) {
      console.warn(`Apify run failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
      return getSamplePosts(nicheSlug)
    }

    const items: TopContentItem[] = await res.json()
    const posts = items
      .map((item) => ({
        text: (item.content || item.title || '').trim(),
        reactions: toCount(item.reactions),
        comments: toCount(item.comments),
        author: item.author,
      }))
      .filter((p) => p.text.length > 40)
      .sort((a, b) => b.reactions + b.comments * 3 - (a.reactions + a.comments * 3))

    if (!posts.length) {
      console.warn(`Apify returned no posts for top-content/${nicheSlug}, using samples`)
      return getSamplePosts(nicheSlug)
    }
    return posts
  } catch (err) {
    console.warn('Apify scrape errored, using samples', err)
    return getSamplePosts(nicheSlug)
  }
}

// Curated stand-ins for scraped posts: each is a proven LinkedIn pattern
// (failure story, number hook, contrarian take, behind-the-scenes, lesson list).
function getSamplePosts(niche: string): ScrapedPost[] {
  const topic = niche.replace(/-/g, ' ')
  return [
    `I lost our biggest client last March.\n\nNot because of price. Because I stopped calling them.\n\nHere is what 11 months of rebuilding taught me about ${topic}.`,
    `3 years ago I had 0 followers and no idea what I was doing in ${topic}.\n\nToday 40% of our inbound comes from LinkedIn.\n\nThe exact system, step by step:`,
    `Unpopular opinion: most advice about ${topic} is written by people who have never done it.\n\nHere is what actually worked for us, with numbers.`,
    `We almost shut down in 2024.\n\n$18k in the bank. Two weeks of runway. One last idea.\n\nThis is the story I have never told publicly.`,
    `I asked 50 people in ${topic} the same question:\n\n"What do you wish you knew in year one?"\n\nThe 5 answers that came up again and again:`,
    `Yesterday a junior on my team said something I cannot stop thinking about.\n\n"Why do we do it this way?"\n\nNobody had a good answer. So we changed it.`,
    `Most people optimise the wrong thing in ${topic}.\n\nThey chase volume. The winners chase one metric nobody talks about.`,
    `Behind the scenes of our worst launch ever.\n\nWhat broke, what I said to the team, and the one decision that saved the quarter.`,
  ].map((text) => ({ text, reactions: 0, comments: 0 }))
}
