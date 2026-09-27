import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WeeklyQuestion from '@/components/dashboard/WeeklyQuestion'
import PostHistory from '@/components/dashboard/PostHistory'
import { WeeklySession, PostAnalytics } from '@/types'

function greeting() {
  const hour = Number(
    new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false })
  )
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  const weekOf = new Date().toISOString().split('T')[0]
  const { data: currentSession } = await supabase
    .from('weekly_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_of', weekOf)
    .maybeSingle()

  const { data: pastSessions } = await supabase
    .from('weekly_sessions')
    .select('*')
    .eq('user_id', user.id)
    .not('id', 'eq', currentSession?.id ?? '')
    .order('week_of', { ascending: false })
    .limit(4)

  const sessionIds = (pastSessions ?? []).map((s: WeeklySession) => s.id)
  const { data: analyticsRows } = sessionIds.length
    ? await supabase
        .from('post_analytics')
        .select('*')
        .in('session_id', sessionIds)
        .order('pulled_at', { ascending: false })
    : { data: [] as PostAnalytics[] }

  const latestAnalyticsBySession = new Map<string, PostAnalytics>()
  for (const row of analyticsRows ?? []) {
    if (!latestAnalyticsBySession.has(row.session_id)) {
      latestAnalyticsBySession.set(row.session_id, row)
    }
  }

  const { data: intel } = currentSession
    ? await supabase
        .from('niche_intelligence')
        .select('winning_format')
        .eq('niche', profile?.niche)
        .eq('week_of', weekOf)
        .maybeSingle()
    : { data: null }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-syne text-2xl font-bold">
        {greeting()}, {firstName}.
      </h1>

      <div className="mt-8">
        <WeeklyQuestion session={currentSession ?? null} winningFormat={intel?.winning_format} />
      </div>

      <h2 className="font-syne text-lg font-bold mt-12 mb-4">Your posts</h2>
      {pastSessions?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pastSessions.map((session: WeeklySession) => (
            <PostHistory
              key={session.id}
              session={session}
              analytics={latestAnalyticsBySession.get(session.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-zinc-400">Your first post is waiting.</p>
      )}
    </div>
  )
}
