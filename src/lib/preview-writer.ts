import { HashtagAuthor } from './post-format'
import { Niche } from './niches'
import { DeepProfile } from './profile'

// ─── Offline post writer ─────────────────────────────────────────────────────
// Shared text helpers for the offline path (sentence splitting, clean-up) and
// the offline question bank. The offline post itself is composed by the
// rule-based strategist (strategist.ts).

const FILLERS =
  /\b(?:um+|uh+|erm|you know|i mean|kind of|sort of|basically|literally|honestly|yaar|lol|i guess|so yeah|ok so|okay so)\b,?\s*/gi
// Abbreviations whose full stop must not end a sentence ("Mr. Pillai").
const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|Prof|Rs|St|Sr|Jr|vs|etc|approx|no)\.(?=\s)/gi
const ABBR_MARK = '․'
const PROFANITY = /\b(f+u+c+k\w*|shit\w*|bullshit|damn|crap|bastard\w*|ass(?:hole)?s?)\b/gi

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function maskProfanity(s: string) {
  return s.replace(PROFANITY, (w) => w[0] + '*'.repeat(Math.max(2, w.length - 1)))
}

// Speech-to-text without punctuation produces run-ons; break long pieces at conjunctions.
function splitLong(sentence: string): string[] {
  if (sentence.split(' ').length <= 28) return [sentence]
  const parts = sentence.split(/\s(?=(?:and then|but|so|because|which|and)\s)/i)
  if (parts.length === 1) return [sentence]
  // Re-join tiny fragments so we don't produce three-word lines.
  const out: string[] = []
  for (const part of parts) {
    const prev = out[out.length - 1]
    if (prev && (prev.split(' ').length < 10 || part.split(' ').length < 6)) out[out.length - 1] = `${prev} ${part}`
    else out.push(part)
  }
  return out.flatMap((p) => (p.split(' ').length > 28 && p !== sentence ? splitLong(p) : [p]))
}

export function toSentences(text: string): string[] {
  const cleaned = text
    .replace(ABBREVIATIONS, (m) => m.slice(0, -1) + ABBR_MARK)
    .replace(FILLERS, '')
    .replace(/,\s*like,\s*/gi, ', ')
    .replace(/\blike\s+(?=\d)/gi, 'about ')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()

  const seen = new Set<string>()
  const sentences: string[] = []
  for (const raw of cleaned.split(/(?<=[.!?])\s+/)) {
    for (const piece of splitLong(raw)) {
      const s = piece
        .trim()
        .replace(/^(?:so|and|but|well|okay|ok|yeah)[, ]+/i, '')
        .replace(/[,;:]$/, '')
        .replaceAll(ABBR_MARK, '.')
      if (s.split(' ').length < 3) continue
      // Voice notes repeat themselves; keep the first telling of each sentence.
      const key = s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (seen.has(key)) continue
      seen.add(key)
      sentences.push(capitalize(/[.!?]$/.test(s) ? s : `${s}.`))
    }
  }
  return sentences
}

export interface PreviewAuthor extends HashtagAuthor {
  goals?: string[]
}

// ─── Offline question bank ───────────────────────────────────────────────────
// Used when the AI can't write a personal question. Templates are matched to the
// person (role, what they want to be known for) and this week's winning format,
// and filled with their industry, stage, function or focus.

interface QuestionTemplate {
  text: string
  types?: string[] // only for these profile types
  angles?: string[] // preferred for these content angles
  format?: RegExp // preferred when the winning format matches
}

const A = {
  insights: 'Sharing industry insights & trends',
  story: 'Telling my founder / career story',
  teach: 'Teaching what I know (education)',
  hot: 'Controversial takes & opinions',
  data: 'Data & research-backed content',
  public: 'Building in public / transparency',
  wins: 'Wins, milestones & social proof',
}

const QUESTIONS: QuestionTemplate[] = [
  // By what they want to be known for
  { angles: [A.insights], text: "What's one thing happening in {industry} right now that most people are reading wrong? What did you see first-hand that proves it?" },
  { angles: [A.insights], text: 'What changed in {industry} in the last 90 days that made you rethink how you work?' },
  { angles: [A.insights], text: "If a friend joined {industry} tomorrow, what's the one shift you'd warn them about, and what's the story that taught you?" },
  { angles: [A.story], text: "What's a moment from your early days that you still think about? Walk me through that day." },
  { angles: [A.story], text: 'Tell me about a career decision people around you thought was wrong. What made you do it anyway?' },
  { angles: [A.story], text: 'Who gave you your first real break, and what did they see that others missed?' },
  { angles: [A.teach], format: /list|how-?to|tactical/i, text: "What's a process you run that others in {industry} would steal if they saw it? Walk me through the steps." },
  { angles: [A.teach], text: "What's the most common mistake you see people make in {industry}, and exactly how would you fix it?" },
  { angles: [A.teach], text: 'If you had 10 minutes to teach a new hire the one thing that took you years to learn, what would you say?' },
  { angles: [A.hot], format: /contrarian|take|opinion/i, text: "What's something everyone in {industry} does that you've quietly stopped doing? Why?" },
  { angles: [A.hot], text: "What's a piece of popular advice in {industry} you think is wrong, and what happened when you ignored it?" },
  { angles: [A.hot], text: "Which 'best practice' in {industry} costs people the most, and what do you do instead?" },
  { angles: [A.data], format: /data|number|metric/i, text: "What's a number from your work this month that surprised you? What's the story behind it?" },
  { angles: [A.data], text: 'What metric do you watch that most people in {industry} ignore, and what has it told you lately?' },
  { angles: [A.data], text: 'Tell me about a time the data said one thing and your gut said another. Who was right?' },
  { angles: [A.public], text: "What's working and what isn't this week? Give me one number for each." },
  { angles: [A.public], text: "What's the hardest trade-off you're making right now, and how are you deciding?" },
  { angles: [A.public], text: "What did you try in the last two weeks that didn't work, and what are you testing next?" },
  { angles: [A.wins], text: "What's a recent win that nobody outside your team knows the full story behind?" },
  { angles: [A.wins], text: 'Who made your last milestone possible, and what exactly did they do?' },
  { angles: [A.wins], text: 'What almost stopped your most recent win from happening?' },

  // By role
  { types: ['founder'], text: 'Walk me through the last conversation with a customer that changed what you build.' },
  { types: ['founder'], text: "At the {stage} stage, what's one thing you're doing that won't scale, and why are you doing it anyway?" },
  { types: ['founder'], text: "What's the hardest call you made as a founder this month, and what did you weigh?" },
  { types: ['founder'], format: /vulnerab|failure|mistake/i, text: 'What almost broke the company this year, and what did you do in the 48 hours after?' },
  { types: ['executive'], text: 'What decision did you make recently that your team pushed back on? How did it play out?' },
  { types: ['executive'], text: "What do you look for in {function} people now that you didn't five years ago?" },
  { types: ['executive'], text: 'Tell me about a meeting this month that changed your mind about something.' },
  { types: ['professional'], text: "What's something you figured out in {function} this month that your manager doesn't know yet?" },
  { types: ['professional'], text: 'Tell me about a time you pushed back on someone senior. What happened?' },
  { types: ['professional', 'executive'], format: /vulnerab|failure|mistake/i, text: 'When did you last feel out of your depth at work? Walk me through that day.' },
  { types: ['freelancer'], text: 'Tell me about a client this month where {focus} got harder than expected. What did you do?' },
  { types: ['freelancer'], text: 'What question do clients always ask you that reveals what they really need?' },
  { types: ['freelancer'], text: "What's the moment a client project turned around, and what did you change?" },
  { types: ['earlycareer'], text: "What's something you learned this month that no course taught you?" },
  { types: ['earlycareer'], text: 'Tell me about a setback on the way to {goal}. What did you do the next day?' },
  { types: ['earlycareer'], text: 'Who is someone senior who helped you recently, and what did they tell you?' },

  // By this week's winning format (anyone)
  { format: /vulnerab|failure|mistake/i, text: 'Describe a mistake you or your team made recently. What happened, and what changed because of it?' },
  { format: /vulnerab|failure|mistake|story/i, text: 'What was the hardest moment of your month, and what did you do next?' },
  { format: /list|how-?to|tactical/i, text: 'If a new hire asked for your three most useful habits, what would you tell them and why?' },
  { format: /contrarian|take|opinion/i, text: "What's one thing you believe about your work that most people in {industry} would disagree with?" },
  { format: /data|number|metric/i, text: "What's a result from the last month you can put a number on, and what caused it?" },
  { text: 'Tell me about a conversation this month that changed how you think about your work.' },
  { text: "What's a small win from the last two weeks that nobody outside your team knows about yet?" },
  { text: 'What decision from the last month would you make differently now, and what did it teach you?' },
]

export interface QuestionPerson extends DeepProfile {
  full_name?: string
}

function slotValues(person: QuestionPerson, niche: Niche): Record<string, string | undefined> {
  const tidy = (s?: string) => s?.replace(/\s*\(.*?\)\s*/g, '').trim()
  return {
    industry: niche.key.split('/')[0].trim(),
    stage: tidy(person.company_stage)?.toLowerCase(),
    function: tidy(person.core_function)?.split('/')[0].trim().toLowerCase(),
    focus: person.consulting_focus ? 'the work' : undefined,
    goal: tidy(person.career_goal)?.toLowerCase(),
  }
}

function fill(text: string, values: Record<string, string | undefined>): string | null {
  let ok = true
  const out = text.replace(/\{(\w+)\}/g, (_, k) => {
    const v = values[k]
    if (!v) ok = false
    return v ?? ''
  })
  return ok ? out : null
}

function hash(seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

// The best-fitting template for this person and week. `seed` should include the
// person and week; bump `variant` to swap to a different question.
export function fallbackQuestion(format: string, person: QuestionPerson, niche: Niche, seed: string, variant = 0): string {
  const values = slotValues(person, niche)
  const angles = person.content_angles ?? []

  const scored = QUESTIONS.flatMap((q) => {
    if (q.types && !q.types.includes(person.profile_type ?? '')) return []
    const text = fill(q.text, values)
    if (!text) return []
    let score = 0
    if (q.types) score += 2
    if (q.angles?.some((a) => angles.includes(a))) score += 3
    if (q.format?.test(format)) score += 1
    return [{ text, score }]
  })

  const best = Math.max(...scored.map((s) => s.score))
  // Everything within one point of the best fit, so different people vary.
  const pool = scored.filter((s) => s.score >= best - 1)
  return pool[(hash(seed) + variant) % pool.length].text
}
