import type { SupabaseClient } from '@supabase/supabase-js'
import { buildWeeklyIntelligence } from './intelligence'
import { personalQuestion } from './drafting'
import { fallbackQuestion } from './preview-writer'
import { PersonContextInput } from './profile'
import { currentWeekOf } from './week'
import { NicheIntelligence } from '@/types'

// Returns this week's intelligence for a niche, building and caching it on first
// request. niche_intelligence is shared across users, so `admin` must be the
// service-role client (RLS only grants writes to the service role).
export async function ensureNicheIntelligence(
  admin: SupabaseClient,
  niche: string,
  nicheSlug: string
): Promise<NicheIntelligence> {
  const weekOf = currentWeekOf()
  const { data: existing } = await admin
    .from('niche_intelligence')
    .select('*')
    .eq('niche', niche)
    .eq('week_of', weekOf)
    .maybeSingle()
  if (existing?.winning_format) return existing

  const intel = await buildWeeklyIntelligence(niche, nicheSlug)
  const row = {
    niche,
    week_of: weekOf,
    winning_format: intel.winning_format,
    winning_hook: intel.winning_hook,
    topic_clusters: intel.topic_clusters,
    insight_summary: intel.insight_summary,
    sample_posts: intel.posts.slice(0, 6).map((post) => ({
      text: post.text,
      likes: post.reactions,
      comments: post.comments,
      format: intel.winning_format,
    })),
    // A generic question for the niche; each user gets a personal one on top.
    generated_question: fallbackQuestion(intel.winning_format, `${niche}:${weekOf}`),
  }

  let { data: saved, error } = await admin
    .from('niche_intelligence')
    .upsert(row, { onConflict: 'niche,week_of' })
    .select()
    .single()
  if (error && /insight_summary/.test(error.message)) {
    // patch-002 not applied yet: save without the new column.
    const { insight_summary: _omit, ...legacyRow } = row
    void _omit
    ;({ data: saved, error } = await admin
      .from('niche_intelligence')
      .upsert(legacyRow, { onConflict: 'niche,week_of' })
      .select()
      .single())
  }
  return saved ?? { ...row, id: '', updated_at: new Date().toISOString() }
}

export interface WeekProfile extends PersonContextInput {
  id: string
  linkedin_niche_slug?: string
}

// Makes sure the user has this week's session, with a question written for them.
// `client` can be the user's own client or the service-role client (cron).
export async function prepareUserWeek(client: SupabaseClient, admin: SupabaseClient, profile: WeekProfile) {
  const weekOf = currentWeekOf()
  const niche = profile.niche || 'Startup Founder'
  const intel = await ensureNicheIntelligence(admin, niche, profile.linkedin_niche_slug || 'entrepreneurship')

  const { data: existing } = await client
    .from('weekly_sessions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('week_of', weekOf)
    .maybeSingle()
  if (existing) return intel

  const question = await personalQuestion(
    {
      winning_format: intel.winning_format,
      winning_hook: intel.winning_hook,
      topic_clusters: intel.topic_clusters ?? [],
      insight_summary: intel.insight_summary ?? '',
    },
    { ...profile, niche }
  )
  await client.from('weekly_sessions').upsert(
    { user_id: profile.id, week_of: weekOf, question, status: 'pending' },
    { onConflict: 'user_id,week_of', ignoreDuplicates: true }
  )
  return intel
}
