import { generateLinkedInPost, generatePhotoRecommendation, generateWeeklyQuestion, NicheAnalysis, PostAuthor } from './content'
import { validatePost } from './post-validator'
import { writePreviewPost, fallbackQuestion } from './preview-writer'
import { fallbackPhotoRecommendation } from './photo-fallback'
import { PersonContextInput } from './profile'
import { currentWeekOf } from './week'
import { PhotoRecommendation } from '@/types'

type Intel = Pick<NicheAnalysis, 'winning_format' | 'winning_hook' | 'topic_clusters'>

// Draft, check it follows Hook + Content + CTA + Hashtags, and quietly retry
// once with the issues noted. The user only ever sees the loading state.
// Falls back to the preview writer if the AI provider is unavailable.
export async function draftPost(transcript: string, intel: Intel, author: PostAuthor) {
  try {
    let post = await generateLinkedInPost(transcript, intel, author)
    const validation = validatePost(post)
    if (!validation.is_valid) {
      if (process.env.NODE_ENV !== 'production') console.info('Draft failed validation, retrying:', validation.issues)
      post = await generateLinkedInPost(transcript, intel, author, validation.issues.join('; '))
    }
    return { post, preview: false }
  } catch (err) {
    console.error('Post generation failed, using preview writer', err)
    return { post: writePreviewPost(transcript, author), preview: true }
  }
}

// A question written for this specific person, on top of the shared niche analysis.
export async function personalQuestion(intel: NicheAnalysis, user: PersonContextInput) {
  try {
    const question = await generateWeeklyQuestion(intel, user)
    if (question) return question
  } catch (err) {
    console.error('Question generation failed, using question bank', err)
  }
  return fallbackQuestion(intel.winning_format, `${user.full_name ?? ''}:${user.niche ?? ''}:${currentWeekOf()}`)
}

export async function recommendPhoto(post: string, user: PersonContextInput): Promise<PhotoRecommendation & { preview?: boolean }> {
  try {
    const rec = await generatePhotoRecommendation(post, user)
    if (rec?.recommendation && Array.isArray(rec.shot_options) && rec.shot_options.length) return rec
  } catch (err) {
    console.error('Photo recommendation failed, using rule-based ideas', err)
  }
  return { ...fallbackPhotoRecommendation(post), preview: true }
}
