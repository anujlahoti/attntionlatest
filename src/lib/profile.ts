import { BrandContext, ProfileType } from '@/types'
import { resolveNiche } from './niches'

// The deep profile collected in onboarding step 4. Every field is optional:
// users can skip cards, and older accounts won't have them at all.
export interface DeepProfile {
  profile_type?: ProfileType
  industry?: string
  company_stage?: string
  core_function?: string
  consulting_focus?: string
  career_goal?: string
  content_angles?: string[]
  target_audience?: string[]
  communication_tone?: string
  linkedin_fear?: string
}

export const DEEP_PROFILE_FIELDS: (keyof DeepProfile)[] = [
  'profile_type',
  'industry',
  'company_stage',
  'core_function',
  'consulting_focus',
  'career_goal',
  'content_angles',
  'target_audience',
  'communication_tone',
  'linkedin_fear',
]

export interface ProfileOption {
  value: string
  label: string
  icon: string
}

export interface ProfileCard {
  field: keyof DeepProfile
  question: string
  note?: string
  kind: 'single' | 'multi' | 'text'
  max?: number
  options?: ProfileOption[]
  placeholder?: string
  allowOther?: boolean
  showIf?: (p: DeepProfile) => boolean
}

const opt = (icon: string, label: string, value = label): ProfileOption => ({ icon, label, value })

export const PROFILE_CARDS: ProfileCard[] = [
  {
    field: 'profile_type',
    question: 'Are you a…',
    kind: 'single',
    options: [
      opt('🏗️', 'Founder / Co-founder', 'founder'),
      opt('🎯', 'Senior Executive (VP, C-suite, Director)', 'executive'),
      opt('💼', 'Mid-level Professional', 'professional'),
      opt('🧑‍💻', 'Freelancer / Consultant', 'freelancer'),
      opt('🌱', 'Early Career / Building in public', 'earlycareer'),
    ],
  },
  {
    field: 'industry',
    question: 'What industry are you in?',
    kind: 'single',
    allowOther: true,
    options: [
      opt('🛍️', 'D2C / E-commerce'),
      opt('💻', 'B2B SaaS / Tech'),
      opt('💰', 'Finance / FinTech'),
      opt('🏥', 'Healthcare / MedTech'),
      opt('🏗️', 'Real Estate / PropTech'),
      opt('📚', 'EdTech / Education'),
      opt('⚡', 'Climate / CleanTech'),
      opt('🎨', 'Creative / Media'),
      opt('🤝', 'HR / Talent / Recruiting'),
      opt('🛒', 'Retail / Consumer'),
      opt('🏭', 'Manufacturing / Supply Chain'),
      opt('🧠', 'Consulting / Professional Services'),
    ],
  },
  {
    field: 'company_stage',
    question: 'What stage is your company at?',
    kind: 'single',
    showIf: (p) => p.profile_type === 'founder',
    options: [
      opt('🌱', 'Idea / Pre-revenue'),
      opt('🚀', 'Early traction (first customers)'),
      opt('📈', 'Growing (scaling revenue)'),
      opt('💼', 'Established (profitable / funded)'),
    ],
  },
  {
    field: 'core_function',
    question: "What's your core function?",
    kind: 'single',
    showIf: (p) => p.profile_type === 'executive' || p.profile_type === 'professional',
    options: [
      opt('📣', 'Marketing / Brand'),
      opt('💵', 'Sales / Revenue'),
      opt('🔧', 'Product / Engineering'),
      opt('📊', 'Finance / Strategy'),
      opt('👥', 'People / HR'),
      opt('⚙️', 'Operations'),
    ],
  },
  {
    field: 'consulting_focus',
    question: 'What do you help clients with?',
    kind: 'text',
    placeholder: 'e.g. I help SaaS companies close enterprise deals',
    showIf: (p) => p.profile_type === 'freelancer',
  },
  {
    field: 'career_goal',
    question: 'What are you building toward?',
    kind: 'single',
    showIf: (p) => p.profile_type === 'earlycareer',
    options: [
      opt('🎓', 'Breaking into a new industry'),
      opt('🏢', 'Landing a role at a top company'),
      opt('🚀', 'Starting my own thing'),
      opt('📢', 'Building my personal brand'),
    ],
  },
  {
    field: 'content_angles',
    question: 'What do you want to be known for on LinkedIn?',
    note: 'Pick up to 2.',
    kind: 'multi',
    max: 2,
    options: [
      opt('💡', 'Sharing industry insights & trends'),
      opt('📖', 'Telling my founder / career story'),
      opt('🎓', 'Teaching what I know (education)'),
      opt('🔥', 'Controversial takes & opinions'),
      opt('📊', 'Data & research-backed content'),
      opt('🤝', 'Building in public / transparency'),
      opt('🌟', 'Wins, milestones & social proof'),
    ],
  },
  {
    field: 'target_audience',
    question: 'Who do you most want to reach?',
    note: 'Pick up to 2.',
    kind: 'multi',
    max: 2,
    options: [
      opt('🧑‍💼', 'Potential clients / customers'),
      opt('💰', 'Investors / VCs'),
      opt('🤝', 'Peers in my industry'),
      opt('🌟', 'Recruiters / employers'),
      opt('🚀', 'Other founders'),
      opt('🎓', 'Students / early career folks'),
      opt('📣', 'Media / journalists'),
    ],
  },
  {
    field: 'communication_tone',
    question: 'How do you naturally communicate?',
    kind: 'single',
    options: [
      opt('🔥', 'Bold & direct — I say what I think'),
      opt('🤝', 'Warm & relatable — I share personal stories'),
      opt('🧠', 'Analytical & data-driven — I back everything up'),
      opt('😄', 'Playful & witty — I like to entertain'),
      opt('🎯', 'Practical & tactical — I give actionable advice'),
    ],
  },
  {
    field: 'linkedin_fear',
    question: "Be honest. What's your #1 fear about posting on LinkedIn?",
    note: 'We all have one. No judgement, it just helps me write around it.',
    kind: 'single',
    options: [
      opt('😬', 'Looking cringe or try-hard'),
      opt('🤖', 'Sounding like everyone else'),
      opt('🦗', 'Posting to crickets (no engagement)'),
      opt('🤔', 'Not knowing what to say'),
      opt('⏱️', 'It taking too much time'),
    ],
  },
]

// Card-dependent answers that no longer apply once profile_type changes.
export function pruneConditional(profile: DeepProfile): DeepProfile {
  const next = { ...profile }
  for (const card of PROFILE_CARDS) {
    if (card.showIf && !card.showIf(next)) delete next[card.field]
  }
  return next
}

const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  founder: 'Founder / Co-founder',
  executive: 'Senior Executive',
  professional: 'Mid-level Professional',
  freelancer: 'Freelancer / Consultant',
  earlycareer: 'Early Career / Building in public',
}

export interface PersonContextInput extends DeepProfile {
  full_name?: string
  profession?: string
  niche?: string
  goals?: string[]
  brand_context?: BrandContext | Record<string, unknown>
  website_url?: string
}

// A plain-text brief on the person, shared by every prompt.
export function buildPersonContext(user: PersonContextInput): string {
  const lines: string[] = []
  if (user.full_name) lines.push(`Name: ${user.full_name}`)
  if (user.profession) lines.push(`Profession/Title: ${user.profession}`)
  if (user.industry) lines.push(`Industry: ${user.industry}`)
  if (user.profile_type) lines.push(`Role type: ${PROFILE_TYPE_LABELS[user.profile_type] ?? user.profile_type}`)
  if (user.company_stage) lines.push(`Company stage: ${user.company_stage}`)
  if (user.core_function) lines.push(`Core function: ${user.core_function}`)
  if (user.consulting_focus) lines.push(`Consulting focus: ${user.consulting_focus}`)
  if (user.career_goal) lines.push(`Career goal: ${user.career_goal}`)
  if (user.content_angles?.length) lines.push(`Wants to be known for: ${user.content_angles.join(', ')}`)
  if (user.target_audience?.length) lines.push(`Target audience on LinkedIn: ${user.target_audience.join(', ')}`)
  if (user.communication_tone) lines.push(`Communication style: ${user.communication_tone}`)
  if (user.linkedin_fear) lines.push(`Their biggest LinkedIn fear: ${user.linkedin_fear}`)
  if (user.goals?.length) lines.push(`LinkedIn goals: ${user.goals.join(', ')}`)

  const brand = Object.entries(user.brand_context ?? {}).filter(([, v]) => v && (!Array.isArray(v) || v.length))
  if (brand.length) {
    lines.push(`Brand context from their website${user.website_url ? ` (${user.website_url})` : ''}:`)
    for (const [k, v] of brand) lines.push(`  - ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
  }
  return lines.join('\n') || 'No profile details yet.'
}

// The identity columns written whenever role or industry change (onboarding,
// the sharpen quiz, settings): one canonical niche from industry, with the role
// label kept in `profession` for the prompts and headline.
export function identityFields(role: string | undefined, industry: string | undefined) {
  const roleLabel = PROFILE_CARDS[0].options!.find((o) => o.value === role)?.label
  const niche = resolveNiche({ industry, profession: roleLabel })
  return {
    profile_type: role || null,
    industry: industry?.trim() || null,
    profession: roleLabel ?? null,
    niche: niche.key,
    linkedin_niche_slug: niche.slug,
  }
}
