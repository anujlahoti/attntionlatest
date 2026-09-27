import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionsWithAnalytics } from '@/lib/queries'
import AppHeader from '@/components/dashboard/AppHeader'
import GalleryItem from '@/components/dashboard/GalleryItem'
import MuseFace from '@/components/ui/MuseFace'
import { buttonClasses } from '@/components/ui/Button'
import { Placard } from '@/components/ui/Art'

export const metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { sessions, analytics } = await getSessionsWithAnalytics(supabase, user.id)
  const published = sessions.filter((s) => s.status === 'published').length

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <Placard>The gallery</Placard>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-[-0.03em]">
            Every week, <em className="text-cobalt">framed.</em>
          </h1>
          <p className="text-ink-soft">
            {sessions.length} {sessions.length === 1 ? 'week' : 'weeks'} · {published} posted
          </p>
        </div>

        {sessions.length ? (
          <div className="mt-12 columns-1 sm:columns-2 lg:columns-3 gap-6">
            {sessions.map((session, i) => (
              <GalleryItem key={session.id} session={session} analytics={analytics.get(session.id)} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-12 canvas-card p-12 text-center">
            <MuseFace size={96} className="mx-auto" />
            <p className="mt-6 font-display text-3xl font-semibold">The walls are bare, for now.</p>
            <p className="mt-2 text-ink-soft">Answer this week&apos;s question and your first canvas will hang here.</p>
            <Link href="/session" className={buttonClasses('accent', 'lg', 'mt-8')}>Start this week →</Link>
          </div>
        )}
      </main>
    </div>
  )
}
