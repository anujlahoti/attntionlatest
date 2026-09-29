// Pushes every persona through the demo endpoints (question → follow-up check →
// draft → photo idea) and scores the results against the fix plan's checks.
// Usage: BASE=http://localhost:3200 node scripts/persona-panel/run-panel.mjs
import fs from 'fs'
import { PERSONAS } from './personas.mjs'

const BASE = process.env.BASE || 'http://localhost:3200'
const OUT = new URL('./panel-results.json', import.meta.url)

async function post(path, body, ip) {
  const t = Date.now()
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text.slice(0, 200) } }
  return { status: res.status, ms: Date.now() - t, json }
}

function score(p, draft, flags) {
  const lines = draft.split('\n').filter((l) => l.trim())
  const hashtags = draft.match(/#\w+/g) || []
  const words = draft.split(/\s+/).filter((w) => w && !w.startsWith('#')).length
  const body = lines.filter((l) => !/^(#\w+\s*)+$/.test(l.trim())).join('\n')
  const norm = lines.map((l) => l.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
  return {
    words,
    hashtags,
    startsWithI: /^I\b/.test(lines[0] || ''),
    hasCTA: /(\?|dm me|my dms|comment|drop|share|tag|let'?s talk|connect|reach out|hiring)/i.test(body),
    keepsFillers: /\b(um|uh|like,|basically|honestly|yaar|lol)\b/i.test(body),
    rawProfanity: /\b(shit\w*|damn|fuck\w*)\b/i.test(body),
    brokenAbbreviation: /\b(Mr|Mrs|Dr|Ms)\.\s*$/m.test(body),
    duplicateLines: norm.length - new Set(norm).size,
    runOnLine: lines.some((l) => l.split(/\s+/).length > 45),
    opentoworkMisfire: hashtags.includes('#opentowork') && !(p.profile_type === 'earlycareer' && /Landing a role|Breaking into/.test(p.career_goal || '')),
    flags: flags.map((f) => f.kind),
  }
}

// Warm the weekly study for every industry in parallel, as the Monday cron does,
// so per-persona timings reflect what users see (a cached study).
if (!process.env.SKIP_WARM) {
  const industries = [...new Set(PERSONAS.map((p) => p.industry))]
  const t = Date.now()
  const warm = await Promise.all(industries.map((industry, k) => post('/api/demo/question', { industry, profile_type: 'founder' }, `10.0.9.${k}`)))
  console.log(`Warmed ${industries.length} industries in ${Math.round((Date.now() - t) / 1000)}s; sources: ${[...new Set(warm.map((w) => w.json.dataSource))].join(', ')}`)
}

const results = []
let i = 0
for (const p of PERSONAS) {
  i++
  const ip = `10.0.1.${i}`
  const profile = { ...p }
  delete profile.transcript; delete profile.style; delete profile.id

  const q = await post('/api/demo/question', profile, ip)
  const intel = q.json
  const fu = await post('/api/demo/follow-up', { ...profile, question: intel.question, answer: p.transcript }, ip)
  const gen = await post('/api/demo/generate', {
    ...profile,
    transcript: p.transcript,
    winningFormat: intel.winningFormat,
    winningHook: intel.winningHook,
    topicClusters: intel.topicClusters,
  }, ip)
  const draft = gen.json.draftPost || ''
  const photo = draft ? await post('/api/demo/photo-recommendation', { ...profile, post: draft }, ip) : { status: 0, ms: 0, json: {} }

  const row = {
    id: p.id, name: p.name, profile_type: p.profile_type, industry: p.industry, goal: p.goals[0], style: p.style,
    niche: intel.niche,
    question: { status: q.status, ms: q.ms, text: intel.question, format: intel.winningFormat, topics: intel.topicClusters, source: intel.dataSource },
    followUp: { needed: fu.json.needed, question: fu.json.question, suggestSwap: fu.json.suggestSwap },
    draft: { status: gen.status, ms: gen.ms, preview: gen.json.preview, text: draft, score: draft ? score(p, draft, gen.json.flags || []) : null },
    photo: { recommendation: photo.json.recommendation, shots: (photo.json.shot_options || []).map((s) => s.type) },
  }
  results.push(row)
  const s = row.draft.score
  console.log(
    `${p.id} ${p.style.slice(0, 26).padEnd(26)} q:${q.ms}ms fu:${fu.json.needed ? 'Y' : '-'} words:${s?.words ?? '-'} flags:[${s?.flags.join(',') ?? ''}] tags:${s?.hashtags.join(' ') ?? '-'}`
  )
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))

// Summary against the fix plan's "done when" checks
const n = results.length
const c = (f) => results.filter(f).length
const sc = (r) => r.draft.score || {}
const qms = results.map((r) => r.question.ms).sort((a, b) => a - b)
console.log('\n=== SUMMARY ===')
console.log('Distinct questions:', new Set(results.map((r) => r.question.text)).size, 'of', n)
console.log('Question latency p50/p95 ms:', qms[Math.floor(n * 0.5)], '/', qms[Math.floor(n * 0.95)])
console.log('Data sources:', [...new Set(results.map((r) => r.question.source))].join(', '))
console.log('Sketch-mode drafts:', c((r) => r.draft.preview), 'of', n)
console.log('#opentowork misfires:', c((r) => sc(r).opentoworkMisfire))
console.log('#entrepreneurship on non-startup industries:', c((r) => sc(r).hashtags?.includes('#entrepreneurship')))
console.log('Hooks starting with "I":', c((r) => sc(r).startsWithI))
console.log('Fillers kept:', c((r) => sc(r).keepsFillers), '| raw profanity:', c((r) => sc(r).rawProfanity), '| broken "Mr.":', c((r) => sc(r).brokenAbbreviation), '| duplicate lines:', c((r) => sc(r).duplicateLines > 0), '| run-on lines:', c((r) => sc(r).runOnLine))
const safetyTargets = ['P05', 'P17', 'P20', 'P24', 'P27']
console.log('Safety flags on target personas:', safetyTargets.map((id) => `${id}:${(results.find((r) => r.id === id)?.draft.score?.flags || []).join('+') || 'NONE'}`).join('  '))
const fuTargets = ['P03', 'P12', 'P25']
console.log('Follow-ups on thin answers:', fuTargets.map((id) => `${id}:${results.find((r) => r.id === id)?.followUp.needed ? 'yes' : 'no'}`).join('  '))
console.log('Distinct photo ideas:', new Set(results.map((r) => r.photo.recommendation)).size, '| distinct shot types:', new Set(results.flatMap((r) => r.photo.shots)).size)
console.log('saved', OUT.pathname)
