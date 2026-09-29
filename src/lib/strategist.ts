// The content-strategist layer: decide WHAT the post is (angle, framework, hook)
// before anything is written. With AI it's a senior strategist's brief; without
// AI a rule-based strategist reads the answer's story beats and still restructures.
import { generateJSON } from './ai'
import { buildPersonContext, PersonContextInput } from './profile'
import { Niche } from './niches'
import { FALLBACK_CTAS, pickHashtags } from './post-format'
import { maskProfanity, PreviewAuthor, toSentences } from './preview-writer'

export interface HookOption {
  type: string // e.g. "Result first", "Near-miss", "Contrarian"
  text: string
  source?: string // the sentence it was built from, when rephrased
}

export interface StrategyBrief {
  angle: string // the one idea the post is about
  core_insight: string // the lesson a stranger could take away
  audience_takeaway: string // why their target audience should care
  framework: string // name of the story structure used
  framework_steps: string[] // the beats, in order
  hook_options: HookOption[]
  chosen_hook: number // index into hook_options
  key_specifics: string[] // numbers, names-as-roles, places that make it credible
  quotes_to_keep: string[] // the author's own lines worth keeping word for word
  source: 'ai' | 'rules'
}

// Proven LinkedIn story structures the strategist chooses from.
export const FRAMEWORKS = [
  { name: 'Setback → Response → Result → Lesson', when: 'something went wrong or nearly did, and they acted', steps: ['The moment it went wrong', 'What they did', 'What happened', 'The lesson for the reader'] },
  { name: 'Contrarian take', when: 'they disagree with common practice', steps: ['The common belief', 'Why it fails (their evidence)', 'What they do instead', 'The new rule'] },
  { name: 'Numbers that tell a story', when: 'the answer is built on metrics', steps: ['The headline number', 'Where it started', 'The change that moved it', 'What the number really means'] },
  { name: 'Playbook', when: 'they describe a repeatable process', steps: ['The result the playbook produces', 'Step 1', 'Step 2', 'Step 3', 'Why it works'] },
  { name: 'Moment → Insight', when: 'a single scene changed their thinking', steps: ['The scene', 'What they noticed', 'What it changed', 'The takeaway'] },
  { name: 'Milestone with gratitude', when: 'a win, a launch or an anniversary', steps: ['The milestone', 'The unglamorous part nobody saw', 'Who made it possible', 'What it means next'] },
] as const

// ─── AI strategist ───────────────────────────────────────────────────────────
export async function aiStrategy(
  transcript: string,
  intel: { winning_format: string; winning_hook: string; topic_clusters: string[] },
  user: PersonContextInput,
  niche: Niche
): Promise<StrategyBrief> {
  const brief = await generateJSON<Omit<StrategyBrief, 'source'>>(`You are a senior LinkedIn content strategist who has grown the personal brands of 100+ ${niche.key} professionals. Before anyone writes, you decide what the post is. You are reading a client's raw voice-note answer. It is raw material, not the post: most voice notes bury the best idea in the middle, wander, and open weakly.

CLIENT
${buildPersonContext(user)}

WHAT IS WINNING IN THEIR NICHE THIS WEEK
- Format: ${intel.winning_format}
- Hook style: ${intel.winning_hook}
- Topics: ${intel.topic_clusters.join(', ') || 'n/a'}

RAW VOICE NOTE
"""${transcript}"""

YOUR JOB
1. Find the single most interesting, specific idea in the answer (often not the first thing they said). That is the angle.
2. Name the core insight a stranger in their audience could apply.
3. Say why their target audience (${user.target_audience?.join(', ') || 'peers in their industry'}) should care.
4. Pick the best framework from: ${FRAMEWORKS.map((f) => `"${f.name}" (${f.when})`).join('; ')}. Prefer the one closest to this week's winning format when it fits the material.
5. Write 4 genuinely different hooks (max 20 words each, never starting with "I", no "Hot take:"/"Unpopular opinion:"), e.g. result-first, near-miss/tension, contrarian, specific number, vivid moment. Use their real specifics. Pick the strongest.
6. List the specifics that make it credible (numbers, timeframes, places, roles; never private people's names or patients' details).
7. Pick 1-2 short lines in their own words worth quoting verbatim (their most vivid phrasing).

Return JSON:
{
  "angle": "one sentence",
  "core_insight": "one sentence",
  "audience_takeaway": "one sentence",
  "framework": "exact framework name from the list",
  "framework_steps": ["beat 1 as it applies to THIS story", "beat 2", "..."],
  "hook_options": [{"type": "Result first", "text": "..."}, {"type": "...", "text": "..."}, {"type": "...", "text": "..."}, {"type": "...", "text": "..."}],
  "chosen_hook": 0,
  "key_specifics": ["..."],
  "quotes_to_keep": ["..."]
}
Return only valid JSON.`)

  if (!brief?.angle || !Array.isArray(brief.hook_options) || !brief.hook_options.length) throw new Error('Strategist returned an incomplete brief')
  const chosen = Number(brief.chosen_hook)
  return {
    ...brief,
    framework_steps: brief.framework_steps ?? [],
    key_specifics: brief.key_specifics ?? [],
    quotes_to_keep: brief.quotes_to_keep ?? [],
    chosen_hook: Number.isInteger(chosen) && chosen >= 0 && chosen < brief.hook_options.length ? chosen : 0,
    source: 'ai',
  }
}

// ─── Rule-based strategist (no AI) ──────────────────────────────────────────
// Classifies each sentence of the answer into a story beat, picks a framework
// from the beats present, and builds hook options from the strongest beats.

const TENSION = /\b(almost|nearly|delay(ed)?|fail(ed|ing)?|lost|los(e|ing)|crash(ed)?|broke|rejected|problem|mistake|wrong|struggl\w*|stuck|churn\w*|missed|ran out|died|forgot|terrified|refused|quit|shit ?show|dead|tired of)\b/i
const ACTION = /\b(i|we|our team)\s+(\w+\s+){0,2}(called|built|moved|fixed|decided|switched|started|rebuilt|created|launched|hired|asked|changed|killed|removed|led|sent|told|made|implemented|reduced|gave|quit|stopped|wrote|shipped|tested|lead|went|installed|finished)\b/i
const RESULT = /\b(waited|grew|renewed|doubled|tripled|went up|increased|dropped|won|closed|saved|signed|crossed|reached|now|today|pays|improved|reduced|cut|went from|stayed|fixed)\b|\d+\s?(%|percent|x\b)|→|\bfrom\b.{1,25}\bto\b/i
const LESSON = /\b(learn(ed|t)?|realis|realiz|lesson|taught|the truth is|what matters|turns out|the thing (nobody|no one)|the only|key is|isn'?t about|is not about|don'?t have a .* problem|beats|is how|is what|should|need to|never|always)\b|,\s*not\s+(a|an|the)?\s*\w+[.!]?$/i
const IMPERATIVE = /^(burn|stop|start|spend|talk|ask|hire|fire|build|ship|write|measure|kill|test|listen|trust|stay|design|let)\b/i
const CONTRARIAN = /\b(everyone|everybody|most people|nobody|no one|stop|myth|overrated|dead|wrong|tired of|instead)\b/i
const LIST = /\b(one|two|three|first|second|third|step \d)\b[,:]/i
const STRONG_RESULT = /\bwent from\b|\bfrom\b.{1,25}\bto\b|\b(doubled|tripled|renewed)\b|\d+\s?(%|percent)/i
// Metrics worth a "numbers" story: numbers with a unit, currency or scale (not ages or counts of things).
const METRIC = /(?:[₹$]\s?\d[\d,.]*|\d[\d,.]*\s?(?:%|percent|x\b|k\b|mrr|arr|crore|cr\b|lakh|million|mn\b|bn\b|months?\b|weeks?\b|days?\b|hours?\b|minutes?\b))/gi
// Openers that only make sense after the previous sentence.
const DANGLING = /^(that|this|it|these|those|because|and|but|so|which|then)\b/i
const LIST_ITEM = /^(one|two|three|four|five|first|second|third|step \d)\b[,:]/i

type Beat = 'situation' | 'tension' | 'action' | 'result' | 'lesson'

function beatOf(s: string): Beat {
  if (LIST_ITEM.test(s)) return 'action'
  if (STRONG_RESULT.test(s) && !LESSON.test(s)) return 'result'
  if (LESSON.test(s) || (IMPERATIVE.test(s) && s.split(' ').length <= 14)) return 'lesson'
  if (RESULT.test(s) && /\d/.test(s) && !TENSION.test(s)) return 'result'
  if (TENSION.test(s)) return 'tension'
  if (ACTION.test(s)) return 'action'
  if (RESULT.test(s)) return 'result'
  return 'situation'
}

function trimTo(s: string, words: number) {
  const w = s.split(' ')
  return w.length <= words ? s : w.slice(0, words).join(' ').replace(/[,;:]$/, '') + '…'
}

export interface RuleStory {
  brief: StrategyBrief
  beats: { beat: Beat; text: string }[]
}

export function ruleStrategy(transcript: string, winningHook: string, niche: Niche, user: PersonContextInput): RuleStory {
  const sentences = toSentences(transcript)
  const beats = sentences.map((text) => {
    const beat = beatOf(text)
    return { beat: beat === 'lesson' && DANGLING.test(text) ? ('situation' as Beat) : beat, text }
  })
  const has = (b: Beat) => beats.some((x) => x.beat === b)
  const first = (b: Beat) => beats.find((x) => x.beat === b)?.text
  const numbers = (transcript.match(METRIC) || []).length

  const framework =
    LIST.test(transcript) && beats.filter((b) => b.beat === 'action').length >= 2
      ? FRAMEWORKS[3]
      : numbers >= 4
        ? FRAMEWORKS[2]
        : (CONTRARIAN.test(transcript) || /\b(tired of|sick of|overrated|stop)\b/i.test(transcript)) && has('lesson')
          ? FRAMEWORKS[1]
          : has('tension') && (has('action') || has('result'))
            ? FRAMEWORKS[0]
            : /\b(closed|raised|launched|milestone|anniversary|first (customer|sale|hire)|series [a-e])\b/i.test(transcript)
              ? FRAMEWORKS[5]
              : FRAMEWORKS[4]

  // Hook candidates built from the strongest beats (never opening with "I").
  const unI = (s?: string) => {
    const m = s?.match(/^I (?:got|was|have been|'ve been|had been) (\w.*)$/)
    return m ? capitalizeFirst(m[1]) : s
  }
  const notI = (s?: string) => (s && !/^I\b/.test(s) && !DANGLING.test(s) ? s : undefined)
  const hooks: HookOption[] = []
  const result = beats.filter((b) => b.beat === 'result').map((b) => b.text).find((t) => /\d/.test(t)) ?? first('result')
  const tension = unI(first('tension'))
  const lessons = beats.filter((b) => b.beat === 'lesson').map((b) => b.text)
  const lesson = lessons.find((l) => !IMPERATIVE.test(l) && !DANGLING.test(l) && l.split(' ').length <= 22) ?? lessons[0]
  if (notI(result)) hooks.push({ type: 'Result first', text: trimTo(result!, 22) })
  if (notI(tension)) hooks.push({ type: 'Near-miss', text: trimTo(tension!, 22), source: first('tension') })
  if (notI(lesson)) hooks.push({ type: 'Lesson first', text: trimTo(lesson!, 22) })
  const numberLine = sentences.find((s) => /\d/.test(s) && notI(s) && s.split(' ').length <= 14)
  if (numberLine && !hooks.some((h) => h.text === numberLine)) hooks.push({ type: 'Specific number', text: numberLine })
  const opener = sentences.find((s) => notI(s))
  if (!hooks.length && opener) hooks.push({ type: 'Scene', text: trimTo(opener, 22) })
  if (!hooks.length) hooks.push({ type: 'Scene', text: trimTo(sentences[0] ?? transcript, 22) })

  // Match this week's winning hook style when we can.
  const preferred = /fail|near|mistake|loss/i.test(winningHook)
    ? 'Near-miss'
    : /number/i.test(winningHook)
      ? 'Specific number'
      : /belief|contrar|challeng/i.test(winningHook)
        ? 'Lesson first'
        : framework === FRAMEWORKS[2]
          ? 'Specific number'
          : 'Result first'
  const want = framework === FRAMEWORKS[3] ? 'Result first' : framework === FRAMEWORKS[1] ? 'Lesson first' : preferred
  const chosen = Math.max(0, hooks.findIndex((h) => h.type === want), hooks.findIndex((h) => h.type === preferred) < 0 ? 0 : -1)

  const specifics = [...new Set(sentences.flatMap((s) => s.match(/\d[\d,.]*\s?(?:%|percent|x\b|k\b|crore|lakh|million|days?|weeks?|months?|years?|people|customers?|calls?)?/gi) ?? []))].slice(0, 6)

  return {
    beats,
    brief: {
      angle: lesson ?? result ?? tension ?? sentences[0] ?? '',
      core_insight: lesson ?? 'The specific moment is the story; the lesson is what readers take away.',
      audience_takeaway: user.target_audience?.length
        ? `Written so ${user.target_audience.join(' and ').toLowerCase()} see what you'd do in their shoes.`
        : `Written so peers in ${niche.key.split('/')[0].trim()} can apply it.`,
      framework: framework.name,
      framework_steps: [...framework.steps],
      hook_options: hooks.slice(0, 4),
      chosen_hook: chosen,
      key_specifics: specifics,
      quotes_to_keep: [],
      source: 'rules',
    },
  }
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Offline composer ────────────────────────────────────────────────────────
// Writes the post from the rule-based brief: the chosen hook, then the story
// beats re-ordered into the framework with short connective lines, then the
// lesson, CTA and hashtags. Restructures the answer rather than transcribing it.
export function composeFromStory(
  story: RuleStory,
  author: PreviewAuthor,
  niche: Niche,
  hookIndex = story.brief.chosen_hook
): string {
  const { brief, beats } = story
  const hook = brief.hook_options[hookIndex] ?? brief.hook_options[0]
  const hookSource = (hook.source ?? hook.text).replace(/…$/, '')
  // Every sentence is used once: the hook's source sentence doesn't repeat below.
  const remaining = beats.filter((b) => !b.text.startsWith(hookSource) && !hookSource.startsWith(b.text.replace(/\.$/, '')))
  const all = (...kinds: Beat[]) => remaining.filter((b) => kinds.includes(b.beat)).map((b) => b.text)
  const we = (remaining.map((b) => b.text).join(' ').match(/\bwe\b/gi)?.length ?? 0) > (remaining.map((b) => b.text).join(' ').match(/\bI\b/g)?.length ?? 0)
  const us = we ? 'we' : 'I'

  const blocks: string[] = [hook.text.replace(/…$/, '.')]
  const push = (label: string | null, lines: string[]) => {
    if (!lines.length) return
    if (label) blocks.push(label)
    blocks.push(...lines)
  }

  switch (brief.framework) {
    case 'Contrarian take':
      push('Here\'s why.', all('situation', 'tension'))
      push(`What ${us} do instead:`, all('action'))
      push('The result?', all('result'))
      push('The rule I now live by:', all('lesson'))
      break
    case 'Numbers that tell a story': {
      const withNumbers = remaining.filter((b) => /\d/.test(b.text) && b.beat !== 'lesson').map((b) => `→ ${b.text}`)
      push('The numbers:', withNumbers)
      push('What moved them:', remaining.filter((b) => !/\d/.test(b.text) && (b.beat === 'action' || b.beat === 'situation')).map((b) => b.text))
      push('What the numbers really say:', all('lesson'))
      break
    }
    case 'Playbook':
      push(null, all('situation'))
      push('Here\'s the playbook:', all('action').map((t, i) => `${i + 1}. ${capitalizeFirst(t.replace(LIST_ITEM, '').trim())}`))
      push(null, all('tension', 'result'))
      push('Why it works:', all('lesson'))
      break
    case 'Milestone with gratitude':
      push('What nobody saw:', all('situation', 'tension'))
      push('What made it possible:', all('action'))
      push(null, all('result'))
      push('What it means next:', all('lesson'))
      break
    case 'Setback → Response → Result → Lesson': {
      // Scene-setting said after the action (e.g. "I start on Monday") is aftermath: it closes the story.
      const firstAction = remaining.findIndex((b) => b.beat === 'action')
      const setup = remaining.filter((b, i) => (b.beat === 'situation' || b.beat === 'tension') && (firstAction < 0 || i < firstAction)).map((b) => b.text)
      const aftermath = remaining.filter((b, i) => (b.beat === 'situation' || b.beat === 'tension') && firstAction >= 0 && i > firstAction).map((b) => b.text)
      push(null, setup)
      push(`So here's what ${us} did.`, all('action'))
      push('The result?', all('result'))
      push(null, aftermath)
      push('The lesson:', all('lesson'))
      break
    }
    default: // Moment → Insight
      push(null, all('situation', 'tension', 'action', 'result'))
      push('What it taught me:', all('lesson'))
  }

  const cta = FALLBACK_CTAS[author.goals?.[0] ?? ''] ?? FALLBACK_CTAS.visibility
  blocks.push(cta, pickHashtags(niche, author).join(' '))
  // Masks strong language in whatever survived the restructure.
  return blocks.map(maskProfanity).join('\n\n')
}

