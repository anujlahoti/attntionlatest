// A no-AI fallback that assembles a LinkedIn-shaped draft from the user's own
// words: hook first, one idea per line, lesson last, then a comment prompt.
// Used only when the AI provider is unavailable, and flagged as a preview in the UI.

const FILLERS = /\b(?:um+|uh+|erm|you know|i mean|kind of|sort of|basically|literally)\b,?\s*/gi
const LESSON = /\b(learn|learnt|learned|realis|realiz|lesson|taught|the truth is|what matters|turns out)/i

const CLOSERS: Record<string, string> = {
  leads: 'Have you dealt with something like this with your own customers?',
  visibility: 'What would you have done differently?',
  speaking: 'Has this happened to you? I would love to hear how you handled it.',
  investors: 'Founders, what would you have done here?',
  hiring: 'Would you want to work on a team that does this?',
  community: 'What is your version of this story?',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function toSentences(text: string): string[] {
  const cleaned = text
    .replace(FILLERS, '')
    .replace(/,\s*like,\s*/gi, ', ')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()

  const sentences: string[] = []
  for (const raw of cleaned.split(/(?<=[.!?])\s+/)) {
    const words = raw.split(' ')
    // Speech-to-text without punctuation produces run-ons; break them at conjunctions.
    if (words.length > 28) {
      for (const part of raw.split(/\s(?=(?:and then|but|so|because|which)\s)/i)) {
        sentences.push(part)
      }
    } else {
      sentences.push(raw)
    }
  }

  return sentences
    .map((s) => s.trim().replace(/^(?:so|and|but|well|okay|ok)[, ]+/i, '').replace(/[,;:]$/, ''))
    .filter((s) => s.split(' ').length >= 3)
    .map((s) => capitalize(/[.!?]$/.test(s) ? s : `${s}.`))
}

export function writePreviewPost(transcript: string, goals: string[] = []): string {
  const sentences = toSentences(transcript)
  if (!sentences.length) return transcript.trim()

  const hookIndex = Math.max(0, sentences.findIndex((s) => /\d/.test(s) && s.split(' ').length <= 12))
  const hook = sentences[hookIndex]
  const rest = sentences.filter((_, i) => i !== hookIndex)

  const lessonIndex = rest.findIndex((s) => LESSON.test(s))
  const lesson = lessonIndex >= 0 ? rest.splice(lessonIndex, 1)[0] : null

  // One idea per line; pair up very short sentences so it doesn't read choppy.
  const body: string[] = []
  let words = hook.split(' ').length
  for (const s of rest) {
    const count = s.split(' ').length
    if (words + count > 210) break
    words += count
    const prev = body[body.length - 1]
    if (prev && prev.split(' ').length < 8 && count < 8) body[body.length - 1] = `${prev} ${s}`
    else body.push(s)
  }

  const closer = CLOSERS[goals[0]] ?? CLOSERS.visibility
  return [hook, ...body, ...(lesson ? [lesson] : []), closer].join('\n\n')
}

// Questions grouped by the winning format they are designed to draw out.
const QUESTION_BANK: Record<string, string[]> = {
  'founder vulnerability story': [
    'Describe a mistake you or your team made recently. What happened, and what changed because of it?',
    'What was the hardest moment of your month, and what did you do next?',
    'When did you last feel out of your depth at work? Walk me through that day.',
  ],
  'tactical list': [
    'What is a process you run that others in your field would steal if they saw it? Walk me through the steps.',
    'If a new hire asked you for your three most useful habits, what would you tell them and why?',
  ],
  'contrarian take': [
    'What is something everyone in your industry does that you have quietly stopped doing, and why?',
    'What is one piece of advice you were given early on that turned out to be wrong?',
  ],
  'data insight': [
    'What is a number from your business this month that surprised you, and what is the story behind it?',
    'What metric do you watch that most people in your field ignore? What has it told you lately?',
  ],
  'personal story with a lesson': [
    'Tell me about a conversation with a customer or client this month that changed how you think about your work.',
    'What is a small win from the last two weeks that nobody outside your team knows about yet?',
    'What is one decision you made in the last month that you would make differently now, and what did it teach you?',
  ],
}

// Stable per niche and week, so everyone in a niche gets the same question that week.
export function fallbackQuestion(format: string, seed: string): string {
  const bank = QUESTION_BANK[format] ?? QUESTION_BANK['personal story with a lesson']
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return bank[hash % bank.length]
}
