import { createAdminClient } from './supabase/admin'
import { aiProvider, hasOpenAIKey, recentAIError } from './ai'

export interface IntegrationStatus {
  key: string
  label: string
  purpose: string
  live: boolean
  fallback: string
}

// What is actually wired up right now, and what the app does instead when not.
export function integrationStatus(): IntegrationStatus[] {
  const provider = aiProvider()
  const aiError = recentAIError()
  return [
    {
      key: 'ai',
      label: provider === 'claude' ? 'Claude' : provider === 'openai' ? 'OpenAI (writer)' : 'AI writer',
      purpose: 'Writes your weekly question and LinkedIn post',
      live: !!provider && !aiError,
      fallback: aiError
        ? `${aiError}. Using the preview writer until it is fixed.`
        : 'No AI key. Using the preview writer (add ANTHROPIC_API_KEY or OPENAI_API_KEY).',
    },
    {
      key: 'whisper',
      label: 'Whisper',
      purpose: 'Turns your voice note into text',
      live: hasOpenAIKey() && !(provider === 'openai' && aiError),
      fallback: 'Using your browser’s speech recognition, or type instead',
    },
    {
      key: 'firecrawl',
      label: 'Firecrawl',
      purpose: 'Reads your website to learn your brand voice',
      live: !!process.env.FIRECRAWL_API_KEY,
      fallback: 'Reads your homepage directly',
    },
    {
      key: 'apify',
      label: 'Apify',
      purpose: 'Scrapes what is trending in your niche',
      live: !!process.env.APIFY_API_TOKEN,
      fallback: 'Uses a curated set of proven posts',
    },
    {
      key: 'blotato',
      label: 'Blotato',
      purpose: 'Publishes to LinkedIn and pulls analytics',
      live: !!process.env.BLOTATO_API_KEY,
      fallback: 'Copy + open LinkedIn in one tap',
    },
  ]
}

// Confirms the schema from supabase/schema.sql has been applied.
export async function databaseStatus(): Promise<IntegrationStatus> {
  const base = {
    key: 'database',
    label: 'Supabase',
    purpose: 'Accounts, weekly sessions, photos and history',
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return { ...base, live: false, fallback: 'Add the Supabase keys to .env.local' }
  }
  try {
    const admin = createAdminClient()
    const tables = ['users', 'weekly_sessions', 'niche_intelligence', 'post_analytics']
    const results = await Promise.all(
      tables.map((t) => admin.from(t).select('*', { count: 'exact', head: true }))
    )
    const missing = tables.filter((_, i) => results[i].error)
    const { data: bucket } = await admin.storage.getBucket('session-files')
    if (missing.length || !bucket) {
      return {
        ...base,
        live: false,
        fallback: `Schema not applied (missing: ${[...missing, ...(bucket ? [] : ['session-files bucket'])].join(', ')}). Run supabase/schema.sql.`,
      }
    }
    return { ...base, live: true, fallback: '' }
  } catch {
    return { ...base, live: false, fallback: 'Could not reach Supabase' }
  }
}
