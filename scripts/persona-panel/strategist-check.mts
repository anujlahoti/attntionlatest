// Shows what the rule-based strategist does with persona answers (no AI needed).
// Run: npx tsx scripts/persona-panel/strategist-check.mts [P01,P02,...]
import { PERSONAS } from './personas.mjs'
import { composeFromStory, ruleStrategy } from '../../src/lib/strategist'
import { resolveNiche } from '../../src/lib/niches'

const ids = (process.argv[2] ?? 'P01,P02,P08,P10,P13').split(',')
for (const raw of PERSONAS.filter((x) => ids.includes(x.id))) {
  const p = raw as unknown as Parameters<typeof ruleStrategy>[3] & { id: string; style: string; transcript: string; goals: string[] }
  const niche = resolveNiche(p)
  const story = ruleStrategy(p.transcript, 'opens with a failure or near-miss', niche, p)
  const b = story.brief
  console.log(`\n=== ${p.id} (${p.style}) → ${b.framework}`)
  console.log(`hooks: ${b.hook_options.map((h, i) => `${i === b.chosen_hook ? '*' : ''}[${h.type}] ${h.text}`).join('  |  ')}`)
  console.log('beats:', story.beats.map((x) => x.beat).join(' → '))
  const post = composeFromStory(story, p, niche)
  console.log('---\n' + post + `\n--- (${post.split(/\s+/).filter((w) => !w.startsWith('#')).length} words)`)
}
