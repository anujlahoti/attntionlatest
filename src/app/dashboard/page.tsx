import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { currentWeekOf } from '@/lib/week'
import { databaseStatus, integrationStatus } from '@/lib/integrations'
import { getSessionsWithAnalytics, weekStreak } from '@/lib/queries'
import AppHeader from '@/components/dashboard/AppHeader'
import WeeklyQuestion from '@/components/dashboard/WeeklyQuestion'
import PostHistory from '@/components/dashboard/PostHistory'
import IntegrationPanel from '@/components/dashboard/IntegrationPanel'
import Badge from '@/components/ui/Badge'
import { Placard } from '@/components/ui/Art'
import { GOALS } from '@/types'
import { resolveNiche } from '@/lib/niches'

export const metadata = { title: 'Studio' }

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

  const weekOf = currentWeekOf()
  const [{ data: profile }, { sessions, analytics }, dbStatus] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    getSessionsWithAnalytics(supabase, user.id, 24),
    databaseStatus(),
  ])

  const currentSession = sessions.find((s) => s.week_of === weekOf) ?? null
  const pastSessions = sessions.filter((s) => s.week_of !== weekOf).slice(0, 4)

  const { data: intel } = await supabase
    .from('niche_intelligence')
    .select('winning_format, topic_clusters')
    .eq('niche', resolveNiche(profile ?? {}).key)
    .eq('week_of', weekOf)
    .maybeSingle()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const postsPublished = sessions.filter((s) => s.status === 'published').length
  const totalImpressions = [...analytics.values()].reduce((sum, a) => sum + a.impressions, 0)
  const streak = weekStreak(sessions, weekOf)
  const goalLabels = (profile?.goals ?? [])
    .map((id: string) => GOALS.find((g) => g.id === id))
    .filter(Boolean) as typeof GOALS
  const weekLabel = new Date(`${weekOf}T00:00:00Z`).toLocaleDateString('en-SG', { day: 'numeric', month: 'long' })

  const stats = [
    { label: 'Week streak', value: streak, bg: 'bg-ochre' },
    { label: 'Posts published', value: postsPublished, bg: 'bg-rose' },
    { label: 'Impressions', value: totalImpressions ? totalImpressions.toLocaleString() : '—', bg: 'bg-surface' },
  ]

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="fade-up">
          <Placard>The studio · week of {weekLabel}</Placard>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl font-semibold tracking-[-0.03em]">
            {greeting()}, <em className="text-terracotta">{firstName}.</em>
          </h1>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_330px]">
          <div className="flex flex-col gap-8 min-w-0">
            <WeeklyQuestion session={currentSession} winningFormat={intel?.winning_format} />

            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {stats.map((s, i) => (
                <div key={s.label} className={`${s.bg} border-2 border-ink p-4 sm:p-5 shadow-ink-sm ${i % 2 ? 'cut-alt' : 'cut'}`}>
                  <p className="font-display text-3xl sm:text-4xl font-semibold tabular-nums">{s.value}</p>
                  <p className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em]">{s.label}</p>
                </div>
              ))}
            </div>

            <a
              href="/api/calendar"
              className="self-start inline-flex items-center gap-2 text-sm font-semibold underline decoration-ochre decoration-2 underline-offset-4 hover:decoration-terracotta"
            >
              📅 Add a Monday reminder to your calendar
            </a>

            <section>
              <div className="flex items-end justify-between mb-5">
                <h2 className="font-display text-3xl font-semibold">Recent canvases</h2>
                {sessions.length > 1 && (
                  <Link href="/gallery" className="text-sm font-semibold underline decoration-2 underline-offset-4 decoration-ochre hover:decoration-terracotta">
                    Full gallery →
                  </Link>
                )}
              </div>
              {pastSessions.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pastSessions.map((session, i) => (
                    <PostHistory key={session.id} session={session} analytics={analytics.get(session.id)} index={i} />
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-ink/40 cut p-10 text-center text-ink-soft">
                  Past weeks will hang here. Your first canvas is waiting above.
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <div className="canvas-card p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl font-semibold">What your muse knows</h3>
                <Link href="/settings" className="text-xs font-semibold underline decoration-ochre decoration-2 underline-offset-2">Edit</Link>
              </div>
              <dl className="mt-4 flex flex-col gap-4 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Niche</dt>
                  <dd className="mt-0.5 font-semibold">{profile?.niche || '—'}{profile?.company ? ` · ${profile.company}` : ''}</dd>
                </div>
                {goalLabels.length > 0 && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Goals</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {goalLabels.map((g) => (
                        <Badge key={g.id}>{g.icon} {g.label}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {profile?.industry && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Industry</dt>
                    <dd className="mt-0.5 font-semibold">{profile.industry}</dd>
                  </div>
                )}
                {profile?.target_audience?.length ? (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Writing for</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {profile.target_audience.map((a: string) => (
                        <Badge key={a} tone="ochre">{a}</Badge>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {profile?.communication_tone && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Your natural voice</dt>
                    <dd className="mt-0.5 font-display text-lg italic">{profile.communication_tone.split(' — ')[0]}</dd>
                  </div>
                )}
                {!profile?.profile_type && (
                  <Link href="/onboarding/profile" className="block bg-ochre border-2 border-ink cut-sm p-3 text-sm font-semibold hover:shadow-ink-sm transition">
                    🎲 Take the 7-tap profile quiz for sharper questions →
                  </Link>
                )}
                {profile?.brand_context?.tone && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Brand voice</dt>
                    <dd className="mt-0.5 font-display text-lg italic capitalize">{profile.brand_context.tone}</dd>
                  </div>
                )}
                {intel?.topic_clusters?.length ? (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Trending in your niche</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {intel.topic_clusters.map((t: string) => (
                        <Badge key={t} tone="rose">{t}</Badge>
                      ))}
                    </dd>
                    <Link href="/insights" className="mt-3 inline-block text-xs font-semibold underline decoration-ochre decoration-2 underline-offset-2">
                      See this week&apos;s insights →
                    </Link>
                  </div>
                ) : null}
              </dl>
            </div>
            <IntegrationPanel integrations={[dbStatus, ...integrationStatus()]} />
          </aside>
        </div>
      </main>
    </div>
  )
}
