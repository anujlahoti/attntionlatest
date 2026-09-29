import {
  critiquePost,
  generateFollowUp,
  generatePhotoRecommendation,
  generateWeeklyQuestion,
  NicheAnalysis,
  PostAuthor,
  writePostFromBrief,
} from './content'
import { aiStrategy, composeFromStory, ruleStrategy, StrategyBrief } from './strategist'
import { validatePost } from './post-validator'
import { fallbackQuestion } from './preview-writer'
import { fallbackPhotoRecommendation } from './photo-fallback'
import { PersonContextInput } from './profile'
import { Niche, resolveNiche } from './niches'
import { checkPost, SafetyFlag } from './safety'
import { recordDraftOutcome } from './alerts'
import { aiProvider } from './ai'
import { currentWeekOf } from './week'
import { PhotoRecommendation } from '@/types'

type Intel = Pick<NicheAnalysis, 'winning_format' | 'winning_hook' | 'topic_clusters'>

export interface Draft {
  post: string
  preview: boolean
  flags: SafetyFlag[]
  strategy: StrategyBrief
}

// Editor scores below this trigger one silent revision.
const MIN_SCORE = 7

// The content-strategist pipeline:
//   1. Strategist: angle, framework, hook options (AI; rule-based as a fallback)
//   2. Writer: writes the post from that brief (restructures, never transcribes)
//   3. Editor: structure check + scores on hook, specificity, value, skimmability,
//      voice; one silent revision with the editor's notes if anything is weak.
// Without an AI provider, the rule-based strategist and composer still
// restructure the answer into the chosen framework (flagged as sketch mode).
export async function draftPost(transcript: string, intel: Intel, author: PostAuthor): Promise<Draft> {
  const niche = resolveNiche(author)
  const story = ruleStrategy(transcript, intel.winning_hook, niche, author)

  if (aiProvider()) {
    try {
      let brief: StrategyBrief
      try {
        brief = await aiStrategy(transcript, intel, author, niche)
      } catch (err) {
        console.error('AI strategist failed, writing from the rule-based brief', err)
        brief = story.brief
      }

      let post = await writePostFromBrief(transcript, brief, author, niche)

      const notes: string[] = []
      const validation = validatePost(post)
      if (!validation.is_valid) notes.push(validation.issues.join('; '))
      try {
        const critique = await critiquePost(post, brief, transcript)
        const weak = Object.entries(critique.scores ?? {}).filter(([, v]) => Number(v) < MIN_SCORE)
        if (weak.length) notes.push(`Weak on ${weak.map(([k, v]) => `${k} (${v}/10)`).join(', ')}. ${critique.feedback ?? ''}`)
      } catch (err) {
        console.error('Editor pass failed, keeping the draft', err)
      }
      if (notes.length) {
        if (process.env.NODE_ENV !== 'production') console.info('Revising draft:', notes.join(' | '))
        post = await writePostFromBrief(transcript, brief, author, niche, notes.join(' '))
      }

      recordDraftOutcome(true)
      return { post, preview: false, flags: checkPost(post), strategy: brief }
    } catch (err) {
      console.error('AI writing failed, using the rule-based strategist', err)
    }
  }

  recordDraftOutcome(false, aiProvider() ? 'AI provider errors' : 'no AI key configured')
  const post = composeFromStory(story, author, niche)
  return { post, preview: true, flags: checkPost(post), strategy: story.brief }
}

// A question written for this specific person, on top of the shared niche analysis.
// `variant` > 0 swaps to a different question (avoiding `previous`).
export async function personalQuestion(
  intel: Pick<NicheAnalysis, 'winning_format' | 'winning_hook'> & { topic_clusters?: string[]; insight_summary?: string },
  user: PersonContextInput,
  niche: Niche = resolveNiche(user),
  variant = 0,
  previous?: string
) {
  try {
    const question = await generateWeeklyQuestion(
      {
        winning_format: intel.winning_format,
        winning_hook: intel.winning_hook,
        topic_clusters: intel.topic_clusters ?? [],
        insight_summary: intel.insight_summary ?? '',
      },
      { ...user, niche: niche.key },
      previous
    )
    if (question) return question
  } catch (err) {
    console.error('Question generation failed, using question bank', err)
  }
  const seed = `${user.full_name ?? ''}:${niche.key}:${user.profile_type ?? ''}:${currentWeekOf()}`
  let question = fallbackQuestion(intel.winning_format, user, niche, seed, variant)
  // Never hand back the same question on a swap.
  for (let v = variant + 1; question === previous && v < variant + 10; v++) {
    question = fallbackQuestion(intel.winning_format, user, niche, seed, v)
  }
  return question
}

export async function recommendPhoto(post: string, user: PersonContextInput): Promise<PhotoRecommendation & { preview?: boolean }> {
  try {
    const rec = await generatePhotoRecommendation(post, user)
    if (rec?.recommendation && Array.isArray(rec.shot_options) && rec.shot_options.length) return rec
  } catch (err) {
    console.error('Photo recommendation failed, using rule-based ideas', err)
  }
  return { ...fallbackPhotoRecommendation(post, user.profile_type), preview: true }
}

// ─── Interview loop ─────────────────────────────────────────────────────────
const THIN_WORDS = 60
const EMPTY_ANSWER = /\b(don'?t (really )?know what to say|nothing (much )?(happened|to say)|no idea|not sure what to say|nothing this week)\b/i

export interface FollowUp {
  needed: boolean
  reason: 'too_thin' | 'off_topic' | 'ok'
  question: string
  suggestSwap: boolean
}

// One follow-up when an answer is too thin (or, with AI, off-topic) to make a
// strong post. Offline, length and "nothing happened" answers are the signal.
export async function followUpFor(question: string, answer: string, user: PersonContextInput): Promise<FollowUp> {
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const empty = EMPTY_ANSWER.test(answer)

  if (aiProvider()) {
    try {
      const verdict = await generateFollowUp(question, answer, user)
      if (verdict && typeof verdict.needs_follow_up === 'boolean') {
        return {
          needed: verdict.needs_follow_up && !!verdict.follow_up,
          reason: verdict.reason ?? 'ok',
          question: verdict.follow_up ?? '',
          suggestSwap: empty,
        }
      }
    } catch (err) {
      console.error('Follow-up check failed, using length rule', err)
    }
  }

  if (empty) {
    return {
      needed: true,
      reason: 'too_thin',
      question: "No problem, quiet weeks happen. What's one small thing that surprised you at work in the last seven days, even something tiny?",
      suggestSwap: true,
    }
  }
  if (words < THIN_WORDS) {
    return {
      needed: true,
      reason: 'too_thin',
      question: 'Love it. Take me into one specific moment: what happened, who was there, and is there a number that shows what changed?',
      suggestSwap: false,
    }
  }
  return { needed: false, reason: 'ok', question: '', suggestSwap: false }
}
