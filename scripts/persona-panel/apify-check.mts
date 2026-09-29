// Checks the niche scraper returns real LinkedIn posts (not samples) for a few niches.
// Run: npx tsx --env-file=.env.local scripts/persona-panel/apify-check.ts
import { scrapeNichePosts } from '../../src/lib/apify'
import { NICHES } from '../../src/lib/niches'

const pick = (process.env.NICHES ?? 'Healthcare / MedTech,Real Estate / PropTech').split(',')

const t = Date.now()
const results = await Promise.all(
  NICHES.filter((n) => pick.includes(n.key)).map(async (n) => ({ niche: n.key, ...(await scrapeNichePosts(n)) }))
)
for (const r of results) {
  console.log(`${r.niche}: source=${r.source}, posts=${r.posts.length}`)
  for (const p of r.posts.slice(0, 2)) console.log(`   ${p.reactions}👍 ${p.comments}💬  ${p.text.slice(0, 90).replace(/\n/g, ' ')}…`)
}
console.log(`took ${Math.round((Date.now() - t) / 1000)}s`)
