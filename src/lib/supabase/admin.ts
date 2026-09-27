import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Bypasses RLS with the secret key — use only for tables that are not
// scoped to a single user (e.g. niche_intelligence), never per-request user data.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}
