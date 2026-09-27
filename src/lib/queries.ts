import type { SupabaseClient } from '@supabase/supabase-js'
import { PostAnalytics, WeeklySession } from '@/types'

// A user's weekly sessions, newest first, with the latest analytics pull for each.
export async function getSessionsWithAnalytics(supabase: SupabaseClient, userId: string, limit = 52) {
  const { data: sessionRows } = await supabase
    .from('weekly_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('week_of', { ascending: false })
    .limit(limit)
  const sessions: WeeklySession[] = sessionRows ?? []

  const analytics = new Map<string, PostAnalytics>()
  if (sessions.length) {
    const { data: rows } = await supabase
      .from('post_analytics')
      .select('*')
      .in('session_id', sessions.map((s) => s.id))
      .order('pulled_at', { ascending: false })
    for (const row of (rows ?? []) as PostAnalytics[]) {
      if (!analytics.has(row.session_id)) analytics.set(row.session_id, row)
    }
  }

  return { sessions, analytics }
}

// Consecutive published weeks, counting back from this week (or last week if
// this week's post is not out yet).
export function weekStreak(sessions: WeeklySession[], weekOf: string) {
  const published = new Set(sessions.filter((s) => s.status === 'published').map((s) => s.week_of))
  const cursor = new Date(`${weekOf}T00:00:00Z`)
  if (!published.has(weekOf)) cursor.setUTCDate(cursor.getUTCDate() - 7)
  let streak = 0
  while (published.has(cursor.toISOString().split('T')[0])) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 7)
  }
  return streak
}
