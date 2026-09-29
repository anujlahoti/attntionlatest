// One canonical niche per industry (quiz card 2). The niche drives the weekly
// study (what posts we read), the hashtags, and which users share a study.
export interface Niche {
  key: string // stored in users.niche and niche_intelligence.niche
  slug: string // linkedin.com/top-content/{slug}/
  queries: string[] // LinkedIn post-search queries used when top-content is empty
  hashtags: { t1: string[]; t2: string[]; t3: string[] }
  keywords: RegExp // maps free-text "Other" industries onto this niche
}

export const NICHES: Niche[] = [
  {
    key: 'D2C / E-commerce',
    slug: 'brand-strategy',
    queries: ['D2C brand founder', 'ecommerce brand growth'],
    hashtags: { t1: ['#ecommerce', '#branding'], t2: ['#d2c', '#dtcbrands', '#brandstrategy'], t3: ['#brandbuilding', '#dtcmarketing'] },
    keywords: /d2c|dtc|e-?commerce|consumer brand|shopify|beauty|fashion|apparel/i,
  },
  {
    key: 'B2B SaaS / Tech',
    slug: 'saas',
    queries: ['B2B SaaS founder', 'SaaS growth lessons'],
    hashtags: { t1: ['#saas', '#tech'], t2: ['#b2bsaas', '#saasfounder', '#productstrategy'], t3: ['#saasmarketing', '#b2bgrowth'] },
    keywords: /saas|software|tech|ai\b|developer|cloud|legal ?tech|dev ?tools/i,
  },
  {
    key: 'Finance / FinTech',
    slug: 'personal-finance',
    queries: ['fintech founder', 'finance leadership lessons'],
    hashtags: { t1: ['#finance', '#fintech'], t2: ['#financialservices', '#cfo', '#payments'], t3: ['#financeleadership', '#fintechstartups'] },
    keywords: /financ|fintech|bank|invest|wealth|insur|account|tax|cfo|payments?/i,
  },
  {
    key: 'Healthcare / MedTech',
    slug: 'healthcare',
    queries: ['healthcare innovation', 'medtech founder'],
    hashtags: { t1: ['#healthcare', '#health'], t2: ['#healthtech', '#medtech', '#digitalhealth'], t3: ['#patientexperience', '#healthcareinnovation'] },
    keywords: /health|medic|hospital|clinic|pharma|patient|biotech|doctor/i,
  },
  {
    key: 'Real Estate / PropTech',
    slug: 'real-estate',
    queries: ['real estate developer', 'proptech'],
    hashtags: { t1: ['#realestate', '#property'], t2: ['#proptech', '#realestatedevelopment', '#housing'], t3: ['#realestateindia', '#realestateinvesting'] },
    keywords: /real ?estate|property|proptech|housing|construction|architect/i,
  },
  {
    key: 'EdTech / Education',
    slug: 'education',
    queries: ['edtech founder', 'education innovation'],
    hashtags: { t1: ['#education', '#edtech'], t2: ['#learning', '#teaching', '#futureofeducation'], t3: ['#edtechstartup', '#lifelonglearning'] },
    keywords: /edu|school|teach|learn|tutor|university|college|student/i,
  },
  {
    key: 'Climate / CleanTech',
    slug: 'sustainability',
    queries: ['climate tech founder', 'clean energy'],
    hashtags: { t1: ['#sustainability', '#climate'], t2: ['#climatetech', '#cleanenergy', '#renewableenergy'], t3: ['#netzero', '#climateaction'] },
    keywords: /climate|clean|solar|energy|sustainab|carbon|ev\b|battery|recycl|green/i,
  },
  {
    key: 'Creative / Media',
    slug: 'content-marketing',
    queries: ['creator economy', 'brand storytelling'],
    hashtags: { t1: ['#marketing', '#creativity'], t2: ['#contentcreator', '#storytelling', '#creatoreconomy'], t3: ['#contentstrategy', '#brandstorytelling'] },
    keywords: /creat|media|design|content|film|music|agency|advertis|newsletter/i,
  },
  {
    key: 'HR / Talent / Recruiting',
    slug: 'human-resources',
    queries: ['HR leadership', 'talent acquisition'],
    hashtags: { t1: ['#hr', '#leadership'], t2: ['#humanresources', '#talentacquisition', '#peopleops'], t3: ['#employeeexperience', '#hiringmanager'] },
    keywords: /\bhr\b|human resources|talent|recruit|hiring|people ops|coach/i,
  },
  {
    key: 'Retail / Consumer',
    slug: 'retail',
    queries: ['retail brand growth', 'consumer brand founder'],
    hashtags: { t1: ['#retail', '#consumer'], t2: ['#retailbusiness', '#customerexperience', '#fmcg'], t3: ['#retailinnovation', '#consumerbrands'] },
    keywords: /retail|consumer|fmcg|store|restaurant|food|hospitality/i,
  },
  {
    key: 'Manufacturing / Supply Chain',
    slug: 'supply-chain-management',
    queries: ['supply chain leadership', 'manufacturing operations'],
    hashtags: { t1: ['#manufacturing', '#supplychain'], t2: ['#operations', '#logistics', '#leanmanufacturing'], t3: ['#supplychainmanagement', '#operationalexcellence'] },
    keywords: /manufactur|supply|logistic|factory|plant|operations|procure/i,
  },
  {
    key: 'Consulting / Professional Services',
    slug: 'management-consulting',
    queries: ['management consulting insights', 'consultant lessons clients'],
    hashtags: { t1: ['#consulting', '#strategy'], t2: ['#managementconsulting', '#businessstrategy', '#leadership'], t3: ['#consultantlife', '#businessgrowth'] },
    keywords: /consult|advis|legal|law|professional services|audit/i,
  },
]

const DEFAULT_NICHE = NICHES[1]

// Role tag appended to the hashtag set.
const ROLE_TAGS: Record<string, string> = {
  founder: '#founder',
  executive: '#leadership',
  professional: '#careergrowth',
  freelancer: '#freelancing',
  earlycareer: '#careerdevelopment',
}

// Legacy accounts only have a profession; map it to the closest industry niche.
const PROFESSION_TO_INDUSTRY: Record<string, string> = {
  'D2C Founder': 'D2C / E-commerce',
  'B2B SaaS Founder': 'B2B SaaS / Tech',
  'Startup Founder': 'B2B SaaS / Tech',
  'VC / Investor': 'Finance / FinTech',
  'Marketing Professional': 'Creative / Media',
  'Finance Professional': 'Finance / FinTech',
  Consultant: 'Consulting / Professional Services',
  'Content Creator': 'Creative / Media',
  'HR / Talent': 'HR / Talent / Recruiting',
  'Product Manager': 'B2B SaaS / Tech',
  'Sales Professional': 'B2B SaaS / Tech',
}

export function nicheByKey(key?: string | null): Niche | undefined {
  return NICHES.find((n) => n.key === key)
}

// The niche for a person: industry first (including free-text "Other"), then
// their legacy profession, then a sensible default.
export function resolveNiche(p: { industry?: string | null; profession?: string | null; niche?: string | null }): Niche {
  const byIndustry = nicheByKey(p.industry) ?? (p.industry ? NICHES.find((n) => n.keywords.test(p.industry!)) : undefined)
  if (byIndustry) return byIndustry
  const byNiche = nicheByKey(p.niche)
  if (byNiche) return byNiche
  const mapped = p.profession ? nicheByKey(PROFESSION_TO_INDUSTRY[p.profession]) : undefined
  if (mapped) return mapped
  // Last resort for free-text professions.
  return (p.profession ? NICHES.find((n) => n.keywords.test(p.profession!)) : undefined) ?? DEFAULT_NICHE
}

export function roleTag(profileType?: string | null) {
  return profileType ? ROLE_TAGS[profileType] : undefined
}

