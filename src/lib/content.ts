import { generateJSON, generateText } from './ai'
import { buildPersonContext, PersonContextInput } from './profile'
import { buildCTAGuidance, buildHashtagGuidance } from './post-format'
import { Niche } from './niches'
import { BrandContext, PhotoRecommendation } from '@/types'

export interface NicheAnalysis {
  winning_format: string
  winning_hook: string
  topic_clusters: string[]
  insight_summary: string
}

export type PostAuthor = PersonContextInput & { linkedin_niche_slug?: string }

function clean(text: string) {
  return text.trim().replace(/^["']|["']$/g, '').trim()
}

// ─── 1. Analyze niche posts ─────────────────────────────────────────────────
export async function analyzeNichePosts(
  posts: { text: string; likes: number; comments: number }[],
  niche: string
) {
  const postsText = posts
    .map((p, i) => `POST ${i + 1} (${p.likes} likes, ${p.comments} comments):\n${p.text}`)
    .join('\n\n---\n\n')

  return generateJSON<NicheAnalysis>(`You are a senior LinkedIn content strategist with 8 years of experience analyzing what makes content go viral in the ${niche} space. You have studied thousands of posts across this niche and you know exactly what psychological triggers, formats, and topics move people to engage.

Analyze these top-performing LinkedIn posts from the ${niche} niche this week and extract the winning pattern.

${postsText}

Return a JSON object with exactly these fields:
{
  "winning_format": "Describe the dominant content structure in 1-2 sentences. Be specific: e.g. 'Personal failure story with 3 numbered lessons and a humble CTA', not just 'storytelling'",
  "winning_hook": "The type of opening line that's working. Be specific: e.g. 'Confession-style opener that names a specific mistake or loss', not just 'emotional hook'",
  "topic_clusters": ["3-5 specific topic themes that are getting traction this week, granular not generic"],
  "insight_summary": "2-3 sentence strategic insight about WHY this content is resonating right now in this niche: what mindset or market moment is it tapping into?"
}

Return only valid JSON, no markdown.`)
}

// ─── 2. Generate the weekly question ────────────────────────────────────────
export async function generateWeeklyQuestion(nicheIntel: NicheAnalysis, user: PersonContextInput, avoid?: string) {
  const text = await generateText(`You are an elite LinkedIn content strategist. You have personally worked with over 100 clients in the ${user.industry || user.niche} space (founders, executives, consultants) and you know this industry inside out. You understand the language people use, the problems they face day-to-day, the wins that make them proud, the frustrations they rarely say out loud, and the stories that resonate with their audience.

You are about to ask ONE question to a client this week. This question will be answered via a 2-3 minute voice note. The answer will become their LinkedIn post.

Here is who your client is:
${buildPersonContext(user)}

Here is what is working on LinkedIn in their niche THIS WEEK:
- Winning format: ${nicheIntel.winning_format}
- Winning hook type: ${nicheIntel.winning_hook}
- Hot topics: ${nicheIntel.topic_clusters.join(', ')}
- Why it's working: ${nicheIntel.insight_summary}

Your job: Ask ONE question that:
1. Feels personal and specific to WHO THEY ARE, not generic
2. Will naturally produce a story, insight, or experience that fits the winning format above
3. Is easy to answer conversationally in a voice note (not a written essay question)
4. Addresses or works with their stated LinkedIn fear: "${user.linkedin_fear || 'not being authentic'}"
5. Is phrased in plain conversational English, like a smart friend asking, not a consultant interviewing
6. Gives them creative latitude: they should be able to draw from recent experience, not have to think hard

DO NOT ask generic questions like "What's a lesson you've learned?" or "What's your biggest challenge?"
DO ask specific questions that only someone in their exact situation would be able to answer authentically.

Examples of GOOD questions (notice how specific they are):
- For a B2B SaaS founder at early traction stage: "Walk me through the conversation with your first customer who said yes. What did they say that surprised you about why they were buying?"
- For a finance executive in their 40s: "What's a spreadsheet or model you built 5 years ago that you look back on now and think 'I had no idea what I was doing', and what would you tell that version of yourself?"
- For an HR consultant: "Tell me about a hiring decision you made recently that went against your gut, and how it turned out."

${avoid ? `They asked for a different question than this one, so ask about something else entirely: "${avoid}"

` : ''}Return ONLY the question. No intro, no explanation, no alternatives. Just the one question.`)
  return clean(text)
}

// ─── 3. Generate the LinkedIn post ──────────────────────────────────────────
export async function generateLinkedInPost(
  transcript: string,
  nicheIntel: Pick<NicheAnalysis, 'winning_format' | 'winning_hook' | 'topic_clusters'>,
  user: PostAuthor,
  revisionNote?: string,
  niche?: Niche
) {
  const text = await generateText(`You are an elite LinkedIn ghostwriter and content strategist. You have written hundreds of viral LinkedIn posts for professionals in the ${user.industry || user.niche} space. You know how real people in this industry think, speak, and tell stories.

You have just received a raw voice note transcript from your client. Your job is to transform it into a high-performing LinkedIn post, without losing their voice, their authenticity, or their original meaning.

━━━ WHO YOUR CLIENT IS ━━━
${buildPersonContext(user)}

━━━ WHAT IS WORKING IN THEIR NICHE THIS WEEK ━━━
Format: ${nicheIntel.winning_format}
Hook type: ${nicheIntel.winning_hook}
Hot topics: ${nicheIntel.topic_clusters.join(', ')}

━━━ RAW VOICE NOTE TRANSCRIPT ━━━
${transcript}

━━━ YOUR TASK ━━━

Transform this transcript into a LinkedIn post using this EXACT structure:

HOOK (1-2 lines)
- Use the winning hook type above
- Must stop the scroll: make the reader think "I need to read this"
- Use the client's actual words where possible: their phrasing, not yours
- Do NOT start with "I" (LinkedIn's algorithm penalises this)
- Do NOT use hollow openers like "Hot take:" or "Unpopular opinion:"

CONTENT BODY (4-8 short paragraphs)
- Use the winning format above
- Keep paragraphs 1-3 lines max (LinkedIn reading pattern)
- Use line breaks generously: white space increases read rate
- Preserve the client's voice: their vocabulary, their rhythm, their specifics
- Fix grammatical errors and filler words ("um", "like", "you know", "basically") silently
- Preserve emotional truth: if they sound uncertain, keep the uncertainty; if they sound proud, keep the pride
- Include specific details (names, numbers, dates, places) from their transcript: specificity is credibility
- Do NOT add details that aren't in the transcript
- If the transcript is in another language or mixes languages (e.g. Hinglish), write the post in natural English while keeping their meaning, phrasing and specifics
- Never include private people's full names, patients' health details, or clients' confidential figures; describe them by role instead ("a client", "one of our patients")

CTA (1-2 lines)
${buildCTAGuidance(user.goals)}

HASHTAGS (on a new line at the end)
${niche ? buildHashtagGuidance(niche, user) : 'Use 4-6 relevant hashtags on one line at the end.'}

━━━ QUALITY RULES ━━━
- The post must sound like it was written BY this person, not FOR them
- Reading it back, they should think "yes, that's exactly what I said, just better"
- No corporate buzzwords. No LinkedIn clichés ("game-changer", "excited to share", "humbled", "blessed")
- No bullet points in the hook
- No em-dashes
- Total length: 150-300 words (not counting hashtags)
- The post must be complete (hook, body, CTA, hashtags) every time
- Do not label the sections; write the post exactly as it should appear on LinkedIn
${revisionNote ? `\nNOTE: The previous draft had these issues: ${revisionNote}. Fix them in this version.\n` : ''}
Return ONLY the finished post. No explanation, no preamble, no alternatives.`)
  return clean(text)
}

// ─── 4. Photo recommendation ────────────────────────────────────────────────
export async function generatePhotoRecommendation(post: string, user: PersonContextInput) {
  return generateJSON<PhotoRecommendation>(`You are a LinkedIn visual content strategist. You know that posts with authentic personal photos get far more engagement than stock photos or no image.

Here is the LinkedIn post that was just drafted:
---
${post}
---

Here is who the client is:
${buildPersonContext(user)}

Analyze the post and recommend what photo they should take RIGHT NOW to go with this post.

Rules:
- Always recommend a real photo of the PERSON themselves (not stock, not AI, not graphics): authenticity is the entire point
- Match the photo mood to the post content
- Keep recommendations easy and doable immediately (phone camera, natural light, no studio needed)
- Give 2-3 specific shot options so they have choices

Return a JSON object:
{
  "recommendation": "One sentence primary recommendation: the single best photo for this post",
  "why": "One sentence explaining why this photo works with this specific post's message",
  "shot_options": [
    {
      "type": "e.g. Mirror selfie / At your desk / Walking outside / At your workspace",
      "description": "Exactly what to do: where to stand, what to wear, what expression, what's in the background",
      "tip": "One quick tip to make this photo better, e.g. natural window light on your left, slight smile not big grin"
    }
  ]
}

Return only valid JSON, no markdown.`)
}

// Pull tone/topics/tagline out of raw website text (used when Firecrawl is not configured)
export async function extractBrandFromText(pageText: string): Promise<BrandContext> {
  return generateJSON<BrandContext>(`Here is the text of a company's website:

${pageText}

Extract the brand's voice. Return JSON:
{
  "tone": "the brand tone/voice in 3 words",
  "key_topics": ["3-5 main topics the brand covers"],
  "tagline": "the tagline or value proposition in one line"
}

Return only valid JSON.`)
}

// ─── 5. Interview follow-up ─────────────────────────────────────────────────
export interface FollowUpVerdict {
  needs_follow_up: boolean
  reason: 'too_thin' | 'off_topic' | 'ok'
  follow_up: string
}

export async function generateFollowUp(question: string, answer: string, user: PersonContextInput) {
  return generateJSON<FollowUpVerdict>(`You are a LinkedIn ghostwriter interviewing a client. You asked them a question and they answered by voice note. Decide whether the answer has enough raw material for a strong 150-300 word post: a specific moment, a detail or number, and what changed or what they learned.

Client:
${buildPersonContext(user)}

Your question: "${question}"
Their answer: "${answer}"

If the answer is rich enough, even if it answers a slightly different question than asked, say it is ok. If it is too thin or vague, ask ONE short, warm follow-up question that pulls out the missing specifics (a moment, a number, what happened next). Never ask more than one question.

Return JSON: {"needs_follow_up": boolean, "reason": "too_thin" | "off_topic" | "ok", "follow_up": "the one follow-up question, or empty string"}
Return only valid JSON.`)
}

// ─── 6. Anonymise a draft ───────────────────────────────────────────────────
export async function anonymizeWithAI(post: string, issues: string[]) {
  const text = await generateText(`You are editing a LinkedIn post before it is published. Rewrite it so it no longer exposes anything the author could regret: ${issues.join('; ')}.

Rules:
- Replace private people's names with their role ("a patient", "one client", "a founder I work with")
- Remove health details about identifiable people, and clients' confidential figures (keep the author's own public numbers)
- Replace named competitors in a negative context with a neutral description ("a big-name firm")
- Soften strong language
- If it gives financial or medical advice, add one short line before the hashtags: "This is my experience, not financial or medical advice."
- Change nothing else: same structure, voice, hook, CTA and hashtags

POST:
${post}

Return only the rewritten post.`)
  return text.trim()
}
