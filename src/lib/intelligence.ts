import { scrapeLinkedInTopContent, ScrapedPost } from './apify'
import { analyzeNichePosts, generateWeeklyQuestion, NicheAnalysis } from './content'
import { fallbackQuestion } from './preview-writer'
import { currentWeekOf } from './week'

export interface WeeklyIntelligence extends NicheAnalysis {
  question: string
  posts: ScrapedPost[]
}

const HOOKS: { hook: string; test: RegExp }[] = [
  { hook: 'opens with a failure or near-miss', test: /\b(fail|failed|lost|mistake|almost|wrong|fired|quit|rejected|broke)\b/i },
  { hook: 'starts with a specific number', test: /^\W*\$?\d/ },
  { hook: 'challenges a common belief', test: /\b(unpopular|stop|most people|nobody|myth|overrated|hot take)\b/i },
  { hook: 'poses a question', test: /\?\s*$/ },
  { hook: 'opens with a specific moment', test: /^(yesterday|last (week|month|year)|today|this morning|in 20\d\d)/i },
]

const FORMATS: { format: string; test: (text: string) => boolean }[] = [
  { format: 'tactical list', test: (t) => (t.match(/^\s*(\d+[.)]|[-•→✅])/gm) || []).length >= 3 },
  { format: 'founder vulnerability story', test: (t) => HOOKS[0].test.test(t) },
  { format: 'contrarian take', test: (t) => HOOKS[2].test.test(t) },
  { format: 'data insight', test: (t) => (t.match(/\d+%|\$\d|\d{2,}/g) || []).length >= 3 },
]

const STOPWORDS = new Set(
  'about after again their there these those which while would could should being other every people really things think where because before still thing years never always great today linkedin posts share learned'.split(' ')
)

function topBy<T extends string>(items: { key: T; weight: number }[]) {
  const totals = new Map<T, number>()
  for (const { key, weight } of items) totals.set(key, (totals.get(key) ?? 0) + weight)
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}

// No-AI analysis of real scraped posts: engagement-weighted hook and format
// patterns plus recurring topic words. Used when the AI provider is unavailable.
export function analyzeHeuristically(posts: ScrapedPost[]): NicheAnalysis {
  const weight = (p: ScrapedPost) => 1 + Math.log10(1 + p.reactions + p.comments * 3)

  const hooks = topBy(
    posts.map((p) => {
      const firstLine = p.text.split('\n').find((l) => l.trim()) ?? ''
      return { key: HOOKS.find((h) => h.test.test(firstLine))?.hook ?? 'opens with a specific moment', weight: weight(p) }
    })
  )
  const formats = topBy(
    posts.map((p) => ({
      key: FORMATS.find((f) => f.test(p.text))?.format ?? 'personal story with a lesson',
      weight: weight(p),
    }))
  )
  const words = topBy(
    posts.flatMap((p) =>
      (p.text.toLowerCase().match(/[a-z]{5,}/g) ?? [])
        .filter((w) => !STOPWORDS.has(w))
        .map((w) => ({ key: w, weight: weight(p) }))
    )
  )

  const winningFormat = formats[0]?.[0] ?? 'personal story with a lesson'
  const totalWeight = formats.reduce((s, [, w]) => s + w, 0) || 1
  const share = Math.round(((formats[0]?.[1] ?? 0) / totalWeight) * 100)

  return {
    winning_format: winningFormat,
    winning_hook: hooks[0]?.[0] ?? 'opens with a specific moment',
    topic_clusters: words.slice(0, 4).map(([w]) => w),
    insight: `${share}% of this week's top posts in your niche use the "${winningFormat}" format.`,
  }
}

export async function buildWeeklyIntelligence(
  niche: string,
  nicheSlug: string,
  goals: string[]
): Promise<WeeklyIntelligence> {
  const posts = await scrapeLinkedInTopContent(nicheSlug)

  let analysis: NicheAnalysis
  try {
    analysis = await analyzeNichePosts(posts.slice(0, 12).map((p) => p.text), niche)
  } catch (err) {
    console.error('AI niche analysis failed, using heuristic analysis', err)
    analysis = analyzeHeuristically(posts)
  }

  let question = ''
  try {
    question = await generateWeeklyQuestion(analysis.winning_format, niche, goals)
  } catch (err) {
    console.error('Question generation failed, using question bank', err)
  }
  question ||= fallbackQuestion(analysis.winning_format, `${niche}:${currentWeekOf()}`)

  return { ...analysis, question, posts }
}
