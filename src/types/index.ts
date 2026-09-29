export interface User {
  id: string
  email: string
  full_name: string
  profession: string
  company: string
  website_url: string
  brand_context: BrandContext
  niche: string
  linkedin_niche_slug: string
  goals: string[]
  onboarding_complete: boolean
  blotato_linkedin_profile_id: string
  created_at: string
  // Deep profile (onboarding step 4)
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

export type ProfileType = 'founder' | 'executive' | 'professional' | 'freelancer' | 'earlycareer'

export interface BrandContext {
  primary_color?: string
  secondary_color?: string
  tone?: string
  key_topics?: string[]
  tagline?: string
}

export interface WeeklySession {
  id: string
  user_id: string
  week_of: string
  question: string
  voice_note_path?: string
  transcript?: string
  draft_post?: string
  final_post?: string
  photo_path?: string
  status: 'pending' | 'transcribed' | 'drafted' | 'published' | 'failed'
  published_at?: string
  linkedin_post_id?: string
  created_at: string
}

export interface NicheIntelligence {
  id: string
  niche: string
  week_of: string
  winning_format: string
  winning_hook: string
  topic_clusters: string[]
  sample_posts: SamplePost[]
  generated_question: string
  insight_summary?: string
  data_source?: 'top-content' | 'search' | 'sample'
  post_count?: number
  updated_at: string
}

export interface PhotoRecommendation {
  recommendation: string
  why: string
  shot_options: { type: string; description: string; tip: string }[]
}

export interface SamplePost {
  text: string
  likes: number
  comments: number
  format: string
}

export interface PostAnalytics {
  id: string
  session_id: string
  impressions: number
  comments: number
  reposts: number
  reactions: number
  pulled_at: string
}

export const GOALS = [
  { id: 'leads', label: 'Generate leads & sales', icon: '💰' },
  { id: 'visibility', label: 'Build brand visibility', icon: '📢' },
  { id: 'speaking', label: 'Get speaking / PR opportunities', icon: '🎤' },
  { id: 'investors', label: 'Attract investor attention', icon: '📈' },
  { id: 'hiring', label: 'Attract top talent', icon: '🤝' },
  { id: 'community', label: 'Grow a community', icon: '🌐' },
]

export const NICHE_MAP: Record<string, string> = {
  'D2C Founder': 'brand-strategy',
  'B2B SaaS Founder': 'saas',
  'Startup Founder': 'entrepreneurship',
  'VC / Investor': 'venture-capital',
  'Marketing Professional': 'social-media-marketing',
  'Finance Professional': 'personal-finance',
  'Consultant': 'management-consulting',
  'Content Creator': 'content-marketing',
  'HR / Talent': 'human-resources',
  'Product Manager': 'product-management',
  'Sales Professional': 'sales',
  'Other': 'entrepreneurship',
}
