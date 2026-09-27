import Anthropic from '@anthropic-ai/sdk'
import { BrandContext } from '@/types'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Analyze scraped posts to extract niche intelligence
export async function analyzeNichePosts(posts: string[], niche: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a LinkedIn content strategist. Analyze these top-performing LinkedIn posts from the "${niche}" niche and extract what is working right now.

Posts:
${posts.join('\n\n---\n\n')}

Return a JSON object with:
{
  "winning_format": "the dominant content format (e.g. 'founder vulnerability story', 'tactical how-to', 'contrarian take', 'data insight', 'personal milestone')",
  "winning_hook": "the hook pattern that appears most (e.g. 'starts with a specific number', 'opens with a failure', 'poses a question')",
  "topic_clusters": ["3-5 topic themes that performed well"],
  "insight": "one sentence on why this content is resonating right now in this niche"
}

Return only valid JSON.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text)
}

// Generate the weekly question based on winning format
export async function generateWeeklyQuestion(
  winningFormat: string,
  niche: string,
  goals: string[]
) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are building a content interview system for LinkedIn.

The winning content format this week in the "${niche}" niche is: "${winningFormat}"
The user's goals are: ${goals.join(', ')}

Write ONE specific question to ask this person that will extract a raw story, insight, or experience they can share on LinkedIn in a way that fits the winning format.

Requirements:
- The question must be easy to answer in a 2-minute voice note
- It should unlock something specific and recent, not generic
- It must feel personal and conversational, not like a content brief
- Do NOT ask "what content do you want to post" — ask about their EXPERIENCE

Return only the question text, nothing else.`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// Generate LinkedIn post from transcript
export async function generateLinkedInPost({
  transcript,
  winningFormat,
  winningHook,
  niche,
  profession,
  brandContext,
  goals,
}: {
  transcript: string
  winningFormat: string
  winningHook: string
  niche: string
  profession: string
  brandContext: BrandContext
  goals: string[]
}) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a LinkedIn ghostwriter. Convert this voice note transcript into a high-performing LinkedIn post.

TRANSCRIPT:
"${transcript}"

CONTEXT:
- Person's role: ${profession}
- Niche: ${niche}
- Their goals: ${goals.join(', ')}
- Brand tone: ${brandContext.tone || 'professional but direct'}
- Key topics they cover: ${brandContext.key_topics?.join(', ') || niche}

WHAT IS WINNING IN THEIR NICHE THIS WEEK:
- Format: ${winningFormat}
- Hook style: ${winningHook}

RULES:
1. Use their EXACT words and phrases from the transcript wherever possible — do not paraphrase
2. Match the winning format exactly
3. Open with a hook that follows the winning hook style
4. Keep it 150-250 words
5. No hashtags
6. No em-dashes
7. End with one line that invites a comment or reaction
8. Do NOT sound like AI — it must sound like a person speaking
9. Use line breaks every 1-3 sentences for LinkedIn readability

Write only the post text, nothing else.`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}
