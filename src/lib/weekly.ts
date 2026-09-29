import type { SupabaseClient } from '@supabase/supabase-js'
import { buildWeeklyIntelligence } from './intelligence'
import { personalQuestion } from './drafting'
import { fallbackQuestion } from './preview-writer'
import { PersonContextInput } from './profile'
import { Niche, NICHES, resolveNiche } from './niches'
import { currentWeekOf } from './week'
import { NicheIntelligence } from '@/types'

// Upsert that survives a database missing newer optional columns (patches not
// yet applied): drops the column PostgREST complains about and retries.
export async function upsertTolerant(
  client: SupabaseClient,
  table: string,
  row: Record<string, unknown>,
  onConflict: string
) {
  let current = { ...row }
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await client.from(table).upsert(current, { onConflict }).select().single()
    if (!error) return data
    const missing = error.message.match(/'(\w+)' column|column "?(\w+)"? (?:of relation|does not exist)/)
    const column = missing?.[1] ?? missing?.[2]
    if (!column || !(column in current)) {
      console.error(`Upsert into ${table} failed`, error.message)
      return null
    }
    const rest = { ...current }
    delete rest[column]
    current = rest
  }
  return null
}

// Same study for everyone in a niche this week; kept in memory as well so the
// demo (and databases without the schema) don't re-scrape on every request.
const memoryCache = new Map<string, NicheIntelligence>()

// A study built from samples (Apify down or over its limit) is retried after a
// few hours instead of being kept for the whole week.
const SAMPLE_RETRY_MS = 6 * 60 * 60 * 1000

function isSampleStudy(row: NicheIntelligence) {
  // Rows from before patch-003 have no data_source: samples are the ones with no engagement.
  return row.data_source === 'sample' || (!row.data_source && !(row.sample_posts ?? []).some((p) => p.likes > 0))
}

function isFresh(row: NicheIntelligence) {
  return !isSampleStudy(row) || Date.now() - new Date(row.updated_at).getTime() < SAMPLE_RETRY_MS
}

// This week's study for a niche, built and cached on first request.
// niche_intelligence is shared across users, so `admin` must be the service-role client.
// Requests for the same niche while a study is being built share that build.
const inFlight = new Map<string, Promise<NicheIntelligence>>()

export async function ensureNicheIntelligence(admin: SupabaseClient | null, niche: Niche): Promise<NicheIntelligence> {
  const cacheKey = `${niche.key}:${currentWeekOf()}`
  const cached = memoryCache.get(cacheKey)
  if (cached && isFresh(cached)) return cached

  const pending = inFlight.get(cacheKey)
  if (pending) return pending
  const build = loadOrBuildStudy(admin, niche, cacheKey).finally(() => inFlight.delete(cacheKey))
  inFlight.set(cacheKey, build)
  return build
}

async function loadOrBuildStudy(admin: SupabaseClient | null, niche: Niche, cacheKey: string): Promise<NicheIntelligence> {
  const weekOf = currentWeekOf()

  if (admin) {
    const { data: existing } = await admin
      .from('niche_intelligence')
      .select('*')
      .eq('niche', niche.key)
      .eq('week_of', weekOf)
      .maybeSingle()
    if (existing?.winning_format && isFresh(existing)) {
      memoryCache.set(cacheKey, existing)
      return existing
    }
  }

  const intel = await buildWeeklyIntelligence(niche)
  const row = {
    niche: niche.key,
    week_of: weekOf,
    winning_format: intel.winning_format,
    winning_hook: intel.winning_hook,
    topic_clusters: intel.topic_clusters,
    insight_summary: intel.insight_summary,
    data_source: intel.source,
    post_count: intel.source === 'sample' ? 0 : intel.posts.length,
    sample_posts: intel.posts.slice(0, 6).map((post) => ({
      text: post.text,
      likes: post.reactions,
      comments: post.comments,
      format: intel.winning_format,
    })),
    // A generic question for the niche; each user gets a personal one on top.
    generated_question: fallbackQuestion(intel.winning_format, {}, niche, `${niche.key}:${weekOf}`),
    updated_at: new Date().toISOString(),
  }

  const saved = admin ? await upsertTolerant(admin, 'niche_intelligence', row, 'niche,week_of') : null
  // Merge so fields the database may lack (before patch-003) survive in memory.
  const result: NicheIntelligence = { id: '', ...row, ...(saved ?? {}) }
  memoryCache.set(cacheKey, result)
  return result
}

// Monday cron: build every niche's study up front so no user waits on a scrape.
// Apify runs are queued (see apify.ts), so starting them together is safe.
export async function prewarmNiches(admin: SupabaseClient) {
  const results = await Promise.allSettled(NICHES.map((n) => ensureNicheIntelligence(admin, n)))
  return results.filter((r) => r.status === 'fulfilled' && !isSampleStudy(r.value)).length
}

export interface WeekProfile extends PersonContextInput {
  id: string
}

// Makes sure the user has this week's session, with a question written for them.
// `client` can be the user's own client or the service-role client (cron).
export async function prepareUserWeek(client: SupabaseClient, admin: SupabaseClient, profile: WeekProfile) {
  const weekOf = currentWeekOf()
  const niche = resolveNiche(profile)
  const intel = await ensureNicheIntelligence(admin, niche)

  const { data: existing } = await client
    .from('weekly_sessions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('week_of', weekOf)
    .maybeSingle()
  if (existing) return { intel, created: false }

  const question = await personalQuestion(intel, { ...profile, niche: niche.key }, niche)
  await client.from('weekly_sessions').upsert(
    { user_id: profile.id, week_of: weekOf, question, status: 'pending' },
    { onConflict: 'user_id,week_of', ignoreDuplicates: true }
  )
  return { intel, created: true, question }
}
