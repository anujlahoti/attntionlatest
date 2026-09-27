import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { currentWeekOf } from '@/lib/week'
import AppHeader from '@/components/dashboard/AppHeader'
import MuseFace from '@/components/ui/MuseFace'
import Badge from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { Placard, Plane } from '@/components/ui/Art'
import { NicheIntelligence, SamplePost } from '@/types'

export const metadata = { title: 'Insights' }

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('niche').eq('id', user.id).single()
  const { data: rows } = await supabase
    .from('niche_intelligence')
    .select('*')
    .eq('niche', profile?.niche)
    .order('week_of', { ascending: false })
    .limit(6)

  const history: NicheIntelligence[] = rows ?? []
  const weekOf = currentWeekOf()
  const current = history.find((h) => h.week_of === weekOf) ?? null
  const previous = history.filter((h) => h.week_of !== weekOf)
  const topPosts: SamplePost[] = (current?.sample_posts ?? []).slice(0, 6)

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <Placard>The study · {profile?.niche || 'your niche'}</Placard>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl font-semibold tracking-[-0.03em] max-w-3xl">
          What your niche is <em className="text-terracotta">responding to</em> this week.
        </h1>

        {!current ? (
          <div className="mt-12 canvas-card p-12 text-center">
            <MuseFace size={96} className="mx-auto" />
            <p className="mt-6 font-display text-3xl font-semibold">This week&apos;s study hasn&apos;t started.</p>
            <p className="mt-2 text-ink-soft">Open this week&apos;s session and your muse will read the top posts in your niche.</p>
            <Link href="/session" className={buttonClasses('accent', 'lg', 'mt-8')}>Start the study →</Link>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="relative overflow-hidden bg-cobalt text-paper border-2 border-ink cut p-6 shadow-ink md:col-span-2">
                <Plane shape="circle" color="#e9b23c" size={130} className="absolute -right-8 -top-8" />
                <p className="relative text-[11px] font-bold uppercase tracking-[0.16em] text-paper/80">Winning format</p>
                <p className="relative mt-2 font-display text-4xl sm:text-5xl font-semibold italic capitalize">{current.winning_format}</p>
                <p className="relative mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-paper/80">Winning hook</p>
                <p className="relative mt-1 text-xl capitalize">{current.winning_hook}</p>
              </div>
              <div className="bg-rose border-2 border-ink cut-alt p-6 shadow-ink">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Topics in the air</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(current.topic_clusters ?? []).map((t) => (
                    <Badge key={t} tone="paper" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em]">Your question</p>
                <p className="mt-1 font-display text-lg leading-snug">{current.generated_question}</p>
              </div>
            </div>

            {topPosts.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display text-3xl font-semibold">Studies from the top posts</h2>
                <p className="mt-1 text-ink-soft text-sm">The posts your muse learned from this week, most engaged first.</p>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {topPosts.map((post, i) => (
                    <article key={i} className={`canvas-card p-5 flex flex-col ${i % 2 ? 'cut-alt' : ''}`}>
                      <span className="font-display italic text-terracotta">Study {i + 1}</span>
                      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line line-clamp-[9] flex-1">{post.text}</p>
                      {(post.likes > 0 || post.comments > 0) && (
                        <p className="mt-4 border-t-2 border-dashed border-ink/25 pt-3 text-xs font-semibold text-ink-soft">
                          👍 {post.likes.toLocaleString()} · 💬 {post.comments.toLocaleString()}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {previous.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl font-semibold">Past weeks</h2>
            <ol className="mt-6 flex flex-col divide-y-2 divide-ink/15 border-y-2 border-ink">
              {previous.map((week) => (
                <li key={week.id} className="py-4 grid gap-1 sm:grid-cols-[160px_1fr_1fr] sm:items-center">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    {new Date(`${week.week_of}T00:00:00Z`).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="font-display text-lg italic capitalize">{week.winning_format}</span>
                  <span className="text-sm text-ink-soft capitalize">{week.winning_hook}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  )
}
