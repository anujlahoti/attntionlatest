import {
  generateFollowUp,
  generateLinkedInPost,
  generatePhotoRecommendation,
  generateWeeklyQuestion,
  NicheAnalysis,
  PostAuthor,
} from './content'
import { validatePost } from './post-validator'
import { writePreviewPost, fallbackQuestion } from './preview-writer'
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
}

// Draft, check it follows Hook + Content + CTA + Hashtags, and quietly retry
// once with the issues noted. The user only ever sees the loading state.
// Falls back to the offline writer if every AI provider is unavailable.
export async function draftPost(transcript: string, intel: Intel, author: PostAuthor): Promise<Draft> {
  const niche = resolveNiche(author)
  try {
    let post = await generateLinkedInPost(transcript, intel, author, undefined, niche)
    const validation = validatePost(post)
    if (!validation.is_valid) {
      if (process.env.NODE_ENV !== 'production') console.info('Draft failed validation, retrying:', validation.issues)
      post = await generateLinkedInPost(transcript, intel, author, validation.issues.join('; '), niche)
    }
    recordDraftOutcome(true)
    return { post, preview: false, flags: checkPost(post) }
  } catch (err) {
    console.error('Post generation failed, using preview writer', err)
    recordDraftOutcome(false, aiProvider() ? 'AI provider errors' : 'no AI key configured')
    const post = writePreviewPost(transcript, author, niche)
    return { post, preview: true, flags: checkPost(post) }
  }
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
