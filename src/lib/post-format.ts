// Hook + Content + CTA + Hashtags: the shared rules every post follows, used by
// both the AI prompt and the offline preview writer.

// Hashtag tiers per LinkedIn niche slug (see NICHE_MAP):
// t1 broad reach (500K+ followers), t2 niche community, t3 hyper-targeted.
const NICHE_HASHTAGS: Record<string, { t1: string[]; t2: string[]; t3: string[] }> = {
  entrepreneurship: {
    t1: ['#entrepreneurship', '#startup', '#founder'],
    t2: ['#startuplife', '#founderlife', '#venturecapital', '#startupstory'],
    t3: ['#earlystagestartup', '#buildinpublic', '#founderjourney'],
  },
  saas: {
    t1: ['#saas', '#startup', '#tech'],
    t2: ['#b2bsaas', '#saasfounder', '#productstrategy', '#growthhacking'],
    t3: ['#saasmarketing', '#b2bgrowth', '#saaslife'],
  },
  'venture-capital': {
    t1: ['#venturecapital', '#startup', '#investing'],
    t2: ['#vc', '#angelinvesting', '#startupecosystem', '#techstartups'],
    t3: ['#earlystageinvesting', '#foundervc', '#dealflow'],
  },
  'brand-strategy': {
    t1: ['#branding', '#marketing', '#entrepreneur'],
    t2: ['#brandstrategy', '#d2c', '#ecommerce', '#dtcbrands'],
    t3: ['#brandbuilding', '#dtcmarketing', '#consumerbrand'],
  },
  'social-media-marketing': {
    t1: ['#marketing', '#socialmedia', '#contentmarketing'],
    t2: ['#digitalmarketing', '#contentcreator', '#linkedincreator'],
    t3: ['#b2bmarketing', '#contentstrategist', '#growthhacking'],
  },
  'management-consulting': {
    t1: ['#consulting', '#leadership', '#strategy'],
    t2: ['#managementconsulting', '#businessstrategy', '#executiveleadership'],
    t3: ['#consultantlife', '#strategicthinking', '#businessgrowth'],
  },
  'human-resources': {
    t1: ['#hr', '#leadership', '#futureofwork'],
    t2: ['#humanresources', '#talentacquisition', '#peopleops'],
    t3: ['#hrtech', '#employeeexperience', '#hiringmanager'],
  },
  'product-management': {
    t1: ['#productmanagement', '#startup', '#tech'],
    t2: ['#productmanager', '#productthinking', '#agile'],
    t3: ['#productledgrowth', '#userresearch', '#productdiscovery'],
  },
  sales: {
    t1: ['#sales', '#b2b', '#revenue'],
    t2: ['#salesstrategy', '#enterprisesales', '#sdr'],
    t3: ['#salestips', '#outboundsales', '#salesleadership'],
  },
  'personal-finance': {
    t1: ['#finance', '#investing', '#wealthbuilding'],
    t2: ['#personalfinance', '#financialliteracy', '#investing101'],
    t3: ['#wealthmindset', '#financialfreedom', '#moneymanagement'],
  },
  'content-marketing': {
    t1: ['#contentmarketing', '#marketing', '#socialmedia'],
    t2: ['#contentcreator', '#contentwriting', '#seo'],
    t3: ['#contentcreatortips', '#linkedinmarketing', '#thoughtleadership'],
  },
}

const AUDIENCE_HASHTAGS: Record<string, string> = {
  'Potential clients / customers': '#clientfirst',
  'Investors / VCs': '#startupfunding',
  'Peers in my industry': '#industryinsights',
  'Recruiters / employers': '#opentowork',
  'Other founders': '#founderlife',
  'Students / early career folks': '#careerdevelopment',
  'Media / journalists': '#pressworthy',
}

function tiersFor(nicheSlug: string) {
  return NICHE_HASHTAGS[nicheSlug] ?? NICHE_HASHTAGS.entrepreneurship
}

// A concrete 5-tag set: 1 broad, 2 niche, 1 targeted, 1 audience (deduplicated).
export function pickHashtags(nicheSlug: string, audience: string[] = []): string[] {
  const t = tiersFor(nicheSlug)
  const tags = [t.t1[0], t.t2[0], t.t2[1], t.t3[0], AUDIENCE_HASHTAGS[audience[0]] ?? '#thoughtleadership']
  return [...new Set(tags)]
}

export function buildHashtagGuidance(nicheSlug: string, audience: string[] = []): string {
  const t = tiersFor(nicheSlug)
  return `Use 4-6 hashtags total:
- 1-2 from Tier 1 (broad reach): ${t.t1.slice(0, 2).join(', ')}
- 2 from Tier 2 (niche community): ${t.t2.slice(0, 2).join(', ')}
- 1-2 from Tier 3 (hyper-targeted): ${t.t3.slice(0, 2).join(', ')}
- Their primary audience is "${audience[0] || 'peers in their industry'}", so consider adding: ${AUDIENCE_HASHTAGS[audience[0]] ?? '#thoughtleadership'}
Place the hashtags on one line at the very end of the post, separated by spaces.`
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
