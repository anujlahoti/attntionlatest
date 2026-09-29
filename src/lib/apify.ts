import { Niche } from './niches'

const APIFY_BASE = 'https://api.apify.com/v2'
const TOP_CONTENT_ACTOR = 'lexis-solutions~linkedin-top-content-scraper'
const SEARCH_ACTOR = 'harvestapi~linkedin-post-search'
// Below this many real posts we don't trust the study and fall back to samples.
export const MIN_REAL_POSTS = 10

export interface ScrapedPost {
  text: string
  reactions: number
  comments: number
  author?: string
}

export type PostSource = 'top-content' | 'search' | 'sample'

export interface NichePosts {
  posts: ScrapedPost[]
  source: PostSource
}

function toCount(value: unknown) {
  if (typeof value === 'number') return value
  const n = parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

// Apify's free plan allows 5 concurrent actor runs; queue ours so a Monday
// pre-warm of every niche (2 actors each) never trips the limit.
const MAX_CONCURRENT_RUNS = 4
let activeRuns = 0
const waiting: (() => void)[] = []

async function withRunSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeRuns >= MAX_CONCURRENT_RUNS) await new Promise<void>((resolve) => waiting.push(resolve))
  activeRuns++
  try {
    return await fn()
  } finally {
    activeRuns--
    waiting.shift()?.()
  }
}

function runActor<T>(actor: string, input: unknown): Promise<T[]> {
  return withRunSlot(() => runActorNow<T>(actor, input))
}

async function runActorNow<T>(actor: string, input: unknown): Promise<T[]> {
  const res = await fetch(`${APIFY_BASE}/acts/${actor}/run-sync-get-dataset-items?timeout=100&memory=1024`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.APIFY_API_TOKEN}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(110_000),
  })
  if (!res.ok) {
    console.warn(`Apify ${actor} failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
    return []
  }
  const items = await res.json()
  return Array.isArray(items) ? items : []
}

async function topContent(niche: Niche): Promise<ScrapedPost[]> {
  const items = await runActor<{ content?: string; title?: string; author?: string; reactions?: unknown; comments?: unknown }>(
    TOP_CONTENT_ACTOR,
    { startUrls: [{ url: `https://www.linkedin.com/top-content/${niche.slug}/` }], maxItems: 15, proxyConfiguration: { useApifyProxy: true } }
  )
  return items.map((i) => ({ text: (i.content || i.title || '').trim(), reactions: toCount(i.reactions), comments: toCount(i.comments), author: i.author }))
}

async function search(niche: Niche): Promise<ScrapedPost[]> {
  const items = await runActor<{ content?: string; author?: { name?: string }; engagement?: { likes?: unknown; comments?: unknown } }>(
    SEARCH_ACTOR,
    { searchQueries: niche.queries, maxPosts: 15, postedLimit: 'month', sortBy: 'relevance' }
  )
  return items.map((i) => ({
    text: (i.content || '').trim(),
    reactions: toCount(i.engagement?.likes),
    comments: toCount(i.engagement?.comments),
    author: i.author?.name,
  }))
}

// Real posts for a niche, most-engaged first. Top-content and keyword search run
// in parallel; below MIN_REAL_POSTS we return labelled samples rather than
// pretending placeholder posts are live LinkedIn data.
export async function scrapeNichePosts(niche: Niche): Promise<NichePosts> {
  if (!process.env.APIFY_API_TOKEN) return { posts: getSamplePosts(niche), source: 'sample' }

  try {
    const [fromTop, fromSearch] = await Promise.all([topContent(niche).catch(() => []), search(niche).catch(() => [])])
    const seen = new Set<string>()
    const posts = [...fromTop, ...fromSearch]
      .filter((p) => p.text.length > 80)
      .filter((p) => {
        const key = p.text.slice(0, 120)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => b.reactions + b.comments * 3 - (a.reactions + a.comments * 3))

    if (posts.length >= MIN_REAL_POSTS) {
      return { posts: posts.slice(0, 30), source: fromTop.length >= MIN_REAL_POSTS ? 'top-content' : 'search' }
    }
    console.warn(`Only ${posts.length} real posts for ${niche.key} (top-content ${fromTop.length}, search ${fromSearch.length}); using samples`)
  } catch (err) {
    console.warn('Apify scrape errored, using samples', err)
  }
  return { posts: getSamplePosts(niche), source: 'sample' }
}

// Curated stand-ins used only when real data is unavailable. Each is a proven
// LinkedIn pattern (failure story, number hook, contrarian take, lesson list).
function getSamplePosts(niche: Niche): ScrapedPost[] {
  const topic = niche.key.split('/')[0].trim()
  return [
    `I lost our biggest client last March.\n\nNot because of price. Because I stopped calling them.\n\nHere is what 11 months of rebuilding taught me about ${topic}.`,
    `3 years ago I had 0 followers and no idea what I was doing in ${topic}.\n\nToday 40% of our inbound comes from LinkedIn.\n\nThe exact system, step by step:`,
    `Unpopular opinion: most advice about ${topic} is written by people who have never done it.\n\nHere is what actually worked for us, with numbers.`,
    `We almost shut down in 2024.\n\n$18k in the bank. Two weeks of runway. One last idea.\n\nThis is the story I have never told publicly.`,
    `I asked 50 people in ${topic} the same question:\n\n"What do you wish you knew in year one?"\n\nThe 5 answers that came up again and again:`,
    `Yesterday a junior on my team said something I cannot stop thinking about.\n\n"Why do we do it this way?"\n\nNobody had a good answer. So we changed it.`,
  ].map((text) => ({ text, reactions: 0, comments: 0 }))
}
