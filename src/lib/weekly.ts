import type { SupabaseClient } from '@supabase/supabase-js'
import { buildWeeklyIntelligence } from './intelligence'
import { currentWeekOf } from './week'
import { NicheIntelligence } from '@/types'

// Returns this week's intelligence for a niche, building and caching it on first
// request. niche_intelligence is shared across users, so `admin` must be the
// service-role client (RLS only grants writes to the service role).
export async function ensureNicheIntelligence(
  admin: SupabaseClient,
  niche: string,
  nicheSlug: string,
  goals: string[]
): Promise<NicheIntelligence> {
  const weekOf = currentWeekOf()
  const { data: existing } = await admin
    .from('niche_intelligence')
    .select('*')
    .eq('niche', niche)
    .eq('week_of', weekOf)
    .maybeSingle()
  if (existing?.generated_question) return existing

  const intel = await buildWeeklyIntelligence(niche, nicheSlug, goals)
  const row = {
    niche,
    week_of: weekOf,
    winning_format: intel.winning_format,
    winning_hook: intel.winning_hook,
    topic_clusters: intel.topic_clusters,
    sample_posts: intel.posts.slice(0, 6).map((post) => ({
      text: post.text,
      likes: post.reactions,
      comments: post.comments,
      format: intel.winning_format,
    })),
    generated_question: intel.question,
  }
  const { data: saved } = await admin
    .from('niche_intelligence')
    .upsert(row, { onConflict: 'niche,week_of' })
    .select()
    .single()
  return saved ?? { ...row, id: '', updated_at: new Date().toISOString() }
}

// Creates the user's session for this week if it does not exist yet.
export async function ensureWeeklySession(client: SupabaseClient, userId: string, question: string) {
  await client.from('weekly_sessions').upsert(
    { user_id: userId, week_of: currentWeekOf(), question, status: 'pending' },
    { onConflict: 'user_id,week_of', ignoreDuplicates: true }
  )
}
