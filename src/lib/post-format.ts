// Hook + Content + CTA + Hashtags: the shared rules every post follows, used by
// both the AI prompt and the offline preview writer.
import { Niche, roleTag } from './niches'

export interface HashtagAuthor {
  target_audience?: string[]
  profile_type?: string | null
  career_goal?: string | null
  goals?: string[]
}

// #opentowork tells a network you are job hunting, so only use it when the
// person actually is (fix for executives and founders getting it).
const JOB_SEEKING_GOALS = ['Landing a role at a top company', 'Breaking into a new industry']

function audienceTag(author: HashtagAuthor): string {
  const audience = author.target_audience?.[0]
  switch (audience) {
    case 'Recruiters / employers':
      return author.profile_type === 'earlycareer' && JOB_SEEKING_GOALS.includes(author.career_goal ?? '')
        ? '#opentowork'
        : author.goals?.includes('hiring')
          ? '#hiring'
          : '#careers'
    case 'Potential clients / customers':
      return '#customerexperience'
    case 'Investors / VCs':
      return '#startupfunding'
    case 'Peers in my industry':
      return '#industryinsights'
    case 'Other founders':
      return '#founders'
    case 'Students / early career folks':
      return '#careeradvice'
    case 'Media / journalists':
      return '#thoughtleadership'
    default:
      return author.goals?.includes('hiring') ? '#hiring' : '#thoughtleadership'
  }
}

// A concrete 5-tag set: 1 broad, 2 niche, 1 targeted, then role or audience (deduplicated).
export function pickHashtags(niche: Niche, author: HashtagAuthor = {}): string[] {
  const t = niche.hashtags
  const tags = [t.t1[0], t.t2[0], t.t2[1], t.t3[0], roleTag(author.profile_type) ?? audienceTag(author), audienceTag(author)]
  return [...new Set(tags)].slice(0, 5)
}

export function buildHashtagGuidance(niche: Niche, author: HashtagAuthor = {}): string {
  const t = niche.hashtags
  const extra = [...new Set([roleTag(author.profile_type), audienceTag(author)].filter(Boolean))]
  return `Use 4-6 hashtags total, all relevant to ${niche.key}:
- 1-2 broad: ${t.t1.join(', ')}
- 2 niche community: ${t.t2.join(', ')}
- 1 hyper-targeted: ${t.t3.join(', ')}
- Optionally 1 of: ${extra.join(', ')}
Never use #opentowork unless it appears in the options above. Place the hashtags on one line at the very end of the post, separated by spaces.`
}

const CTA_GUIDANCE: Record<string, string> = {
  leads: 'Soft CTA that invites potential clients to connect or DM, e.g. "If you\'re working through something similar, I\'d love to hear about it."',
  visibility: 'Engagement-driving CTA: a question that makes readers want to comment, e.g. "What would you have done differently?"',
  speaking: 'Authority-building CTA that positions them as a resource, e.g. "I speak about this at events. If you want me at your next one, let\'s talk."',
  investors: 'Social-proof CTA that signals traction, e.g. "We\'re building in this space. If it resonates, I\'d love to connect."',
  hiring: 'Talent-attracting CTA that makes the mission magnetic, e.g. "If this is the kind of thinking you want on your team, we\'re hiring."',
  community: 'Community-building CTA that invites people in, e.g. "Drop your thoughts below."',
}

export function buildCTAGuidance(goals: string[] = []): string {
  return CTA_GUIDANCE[goals[0]] ?? 'Conversational CTA that invites the reader to share their own experience or perspective.'
}

// Ready-made CTA lines for the offline writer.
export const FALLBACK_CTAS: Record<string, string> = {
  leads: "If you're working through something similar, I'd love to hear about it. My DMs are open.",
  visibility: 'What would you have done differently?',
  speaking: "I talk about this a lot. If it's useful for your team or event, let's talk.",
  investors: "We're building in this space. If this resonates, I'd love to connect.",
  hiring: "If this is the kind of thinking you want on your team, we're hiring. Reach out.",
  community: 'Drop your version of this story below. I read every comment.',
}
