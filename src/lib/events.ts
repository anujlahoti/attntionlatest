import type { SupabaseClient } from '@supabase/supabase-js'

// Product events behind the success metrics (see the fix plan): question shown,
// draft shown, posted, returned, email clicks. Best effort: a missing table
// (patch-003 not applied) or a failed insert never breaks the user's flow.
export const EVENT_NAMES = [
  'question_shown',
  'question_swapped',
  'follow_up_asked',
  'draft_shown',
  'safety_flagged',
  'safety_anonymised',
  'posted',
  'results_logged',
  'email_sent',
  'email_click',
] as const

export type EventName = (typeof EVENT_NAMES)[number]

export async function trackEvent(client: SupabaseClient, userId: string, name: EventName, props: Record<string, unknown> = {}) {
  try {
    const { error } = await client.from('events').insert({ user_id: userId, name, props })
    if (error && !/events|relation/i.test(error.message)) console.warn('trackEvent failed', error.message)
  } catch {
    // Analytics must never break the product.
  }
}
