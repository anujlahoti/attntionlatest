import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Logo from '@/components/ui/Logo'
import MuseFace from '@/components/ui/MuseFace'
import Badge from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { LineDove, Placard, Plane } from '@/components/ui/Art'
import { Waveform } from '@/components/session/Bubbles'
import LinkedInPreview from '@/components/session/LinkedInPreview'

const PLATES = [
  {
    numeral: 'I',
    title: 'The Study',
    body: 'Every week your muse reads the top-performing posts in your niche and works out which format and hook are winning right now.',
    plane: 'bg-rose',
    shapes: (
      <>
        <Plane shape="eye" color="#fbf8f1" size={86} className="absolute left-6 top-5" />
        <Plane shape="triangle" color="#2346b5" size={54} rotate={14} className="absolute right-7 bottom-3" />
      </>
    ),
  },
  {
    numeral: 'II',
    title: 'The Question',
    body: 'Not a content brief. One sharp question about your week that pulls out a story only you can tell.',
    plane: 'bg-ochre',
    shapes: (
      <>
        <Plane shape="half" color="#d4553a" size={90} className="absolute left-5 top-8" />
        <span className="absolute right-8 top-4 font-display text-7xl italic">?</span>
      </>
    ),
  },
  {
    numeral: 'III',
    title: 'The Sitting',
    body: 'Talk for two minutes into your phone. Your muse keeps your exact words and phrasing, so it sounds like you on your best day.',
    plane: 'bg-cobalt',
    shapes: (
      <>
        <Plane shape="circle" color="#e9b23c" size={74} className="absolute left-7 top-6" />
        <span className="absolute right-6 bottom-6 text-paper"><Waveform bars={14} /></span>
      </>
    ),
  },
  {
    numeral: 'IV',
    title: 'The Canvas',
    body: 'Review the draft, add a real photo, and publish to LinkedIn in one tap. Then you are done until next Monday.',
    plane: 'bg-olive',
    shapes: (
      <>
        <Plane shape="square" color="#fbf8f1" size={78} rotate={-8} className="absolute left-7 top-5" />
        <Plane shape="quarter" color="#eba59c" size={60} className="absolute right-6 bottom-2" />
      </>
    ),
  },
]

const PALETTE = [
  { color: 'bg-cobalt', title: 'Knows what is working', body: 'Live niche intelligence picks the hook and format for you.' },
  { color: 'bg-rose', title: 'Sounds like you', body: 'Built from your voice and your brand, never generic AI filler.' },
  { color: 'bg-ochre', title: 'Real photos, real reach', body: 'Posts with a genuine photo earn more attention. We nudge you to add one.' },
  { color: 'bg-olive', title: 'Seven minutes a week', body: 'One question, one voice note, one post. A habit you can actually keep.' },
]

const MARQUEE = ['Studied', 'Asked', 'Spoken', 'Painted', 'Posted', 'Repeated']

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b-2 border-ink">
        <nav className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#plates" className="hover:text-terracotta transition">How it works</a>
            <a href="#before-after" className="hover:text-terracotta transition">See the difference</a>
            <Link href="/demo" className="hover:text-terracotta transition">Live demo</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className={buttonClasses('primary', 'sm')}>Open your studio</Link>
            ) : (
              <>
                <Link href="/login" className={buttonClasses('ghost', 'sm', 'hidden sm:inline-flex')}>Sign in</Link>
                <Link href="/demo" className={buttonClasses('primary', 'sm')}>Try it free</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-20 grid gap-14 lg:grid-cols-[1.05fr_1fr] items-center">
          <div className="fade-up">
            <Placard numeral="No. 1">A weekly LinkedIn ritual</Placard>
            <h1 className="mt-6 font-display text-[52px] leading-[0.98] sm:text-[80px] font-semibold tracking-[-0.03em]">
              Speak for two minutes.
              <br />
              We&apos;ll <em className="brush text-cobalt">paint</em> the post.
            </h1>
            <p className="mt-7 max-w-lg text-lg text-ink-soft leading-relaxed">
              Every Monday your muse studies what is winning in your niche, asks you one sharp question, listens to your
              voice note, and composes a LinkedIn post in your own words.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <Link href="/demo" className={buttonClasses('accent', 'lg')}>Try it now, no signup →</Link>
              <Link href={user ? '/dashboard' : '/login'} className={buttonClasses('secondary', 'lg')}>
                {user ? 'Go to your studio' : 'Create your account'}
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">Seven minutes. One post. Every week.</p>
          </div>

          {/* The collage */}
          <div className="relative h-[440px] sm:h-[540px]" aria-hidden>
            <div className="absolute inset-x-6 inset-y-8 bg-cobalt border-2 border-ink cut -rotate-3 shadow-ink" />
            <Plane shape="circle" color="#eba59c" size={120} className="absolute -left-2 top-2 float-slow" />
            <Plane shape="triangle" color="#5f7a4f" size={80} rotate={-18} className="absolute right-2 bottom-2" />
            <div className="absolute left-2 sm:left-8 top-20 sm:top-24">
              <MuseFace size={250} className="sm:w-[280px] sm:h-[280px]" />
            </div>
            <div
              className="absolute right-0 top-4 w-[230px] sm:w-[260px] bg-ochre border-2 border-ink cut-sm p-4 shadow-ink float-slow"
              style={{ ['--tilt' as string]: '4deg' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">This week&apos;s question</p>
              <p className="mt-2 font-display text-lg leading-snug font-semibold">
                What almost went wrong with a customer this month, and what did you change?
              </p>
            </div>
            <div
              className="absolute left-0 bottom-3 hidden sm:flex items-center gap-3 bg-ink text-paper border-2 border-ink cut-alt px-4 py-3 shadow-[5px_5px_0_0_#e9b23c] float-slow"
              style={{ ['--tilt' as string]: '-3deg', animationDelay: '-2s' }}
            >
              <span className="h-8 w-8 rounded-full bg-terracotta border-2 border-paper flex items-center justify-center text-xs">▶</span>
              <Waveform bars={18} />
              <span className="text-xs text-paper/70">1:48</span>
            </div>
            <div
              className="absolute right-0 bottom-0 hidden sm:block w-[260px] rotate-2 shadow-ink"
            >
              <LinkedInPreview
                name="Priya Nair"
                headline="Founder, Loop Studio"
                clamp
                text={'We almost lost our biggest client over a spreadsheet.\n\nThree months in, their COO told me nobody had opened it once.\n\nSo we killed it.'}
              />
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="border-y-2 border-ink bg-ink text-paper overflow-hidden py-4" aria-hidden>
          <div className="marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0">
                {[...MARQUEE, ...MARQUEE].map((word, i) => (
                  <span key={`${copy}-${i}`} className="flex items-center gap-8 px-8 font-display text-3xl italic">
                    {word}
                    <span className={`h-4 w-4 border-2 border-paper ${['bg-ochre rotate-45', 'bg-rose rounded-full', 'bg-cobalt'][i % 3]}`} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Plates */}
        <section id="plates" className="mx-auto max-w-6xl px-4 sm:px-6 py-24 scroll-mt-20">
          <Placard numeral="Plates I–IV">How it works</Placard>
          <h2 className="mt-4 font-display text-4xl sm:text-6xl font-semibold tracking-[-0.03em] max-w-3xl leading-[1.02]">
            One question in. <em className="text-terracotta">One portrait</em> of your week out.
          </h2>
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {PLATES.map((plate, i) => (
              <article key={plate.numeral} className={`canvas-card overflow-hidden ${i % 2 ? 'lg:translate-y-10' : ''}`}>
                <div className={`relative h-36 border-b-2 border-ink ${plate.plane}`}>
                  {plate.shapes}
                  <span className="absolute left-4 bottom-2 font-display text-5xl italic font-semibold text-ink/90 mix-blend-multiply">
                    {plate.numeral}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-2xl font-semibold">{plate.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">{plate.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Before / after */}
        <section id="before-after" className="bg-paper-deep border-y-2 border-ink scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
            <Placard>See the difference</Placard>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.03em] max-w-2xl">
              What you said. <em>What your muse painted.</em>
            </h2>
            <div className="mt-12 grid gap-8 lg:grid-cols-2 items-start">
              <div className="bg-rose border-2 border-ink cut-alt p-6 shadow-ink -rotate-1">
                <Badge tone="paper">Your voice note · 1:52</Badge>
                <p className="mt-4 text-ink-soft leading-relaxed italic">
                  &ldquo;So um, we had this client, our biggest one, and we were sending them this like forty tab spreadsheet
                  every Friday, and honestly three months in their COO just tells me nobody has opened it. Not once. So we
                  killed it, now it&apos;s literally one number and one sentence on Monday, and they renewed for two years. I
                  think the lesson is you keep doing stuff just because you started doing it.&rdquo;
                </p>
              </div>
              <div className="rotate-1">
                <LinkedInPreview
                  name="Priya Nair"
                  headline="Founder, Loop Studio"
                  text={'We almost lost our biggest client over a spreadsheet.\n\nThey asked for a weekly report. We sent a 40-tab monster every Friday.\n\nThree months in, their COO told me nobody had opened it. Not once.\n\nSo we killed it. Now it is one number and one sentence, sent on Monday.\n\nThey renewed for two years.\n\nWhat are you still doing just because you started doing it?'}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Manifesto */}
        <section className="relative overflow-hidden bg-cobalt text-paper border-b-2 border-ink">
          <Plane shape="quarter" color="#e9b23c" size={260} className="absolute -left-16 -bottom-16" />
          <Plane shape="circle" color="#eba59c" size={120} className="absolute right-10 top-10 hidden sm:block" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-28 text-center">
            <LineDove className="mx-auto w-56 [&_path]:stroke-paper [&_circle]:fill-paper" />
            <blockquote className="mt-6 font-display text-4xl sm:text-6xl leading-[1.05] font-semibold italic tracking-tight">
              &ldquo;Inspiration exists, but it has to find you working.&rdquo;
            </blockquote>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-paper/80">Attributed to Pablo Picasso</p>
            <p className="mt-8 text-lg text-paper/90">Attntion makes sure it finds you every Monday morning.</p>
          </div>
        </section>

        {/* Palette */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
          <Placard>The palette</Placard>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.03em] max-w-2xl">
            Consistency, without the blank page.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PALETTE.map((item, i) => (
              <div key={item.title}>
                <span className={`block h-14 w-14 border-2 border-ink ${item.color} ${['rounded-full', 'cut', 'rotate-12', 'cut-alt'][i]}`} />
                <h3 className="mt-5 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
          <div className="relative overflow-hidden bg-ochre border-2 border-ink cut p-10 sm:p-16 shadow-ink text-center">
            <Plane shape="half" color="#d4553a" size={180} className="absolute -right-10 -top-6 rotate-180" />
            <Plane shape="square" color="#2346b5" size={70} rotate={14} className="absolute left-8 bottom-6 hidden sm:block" />
            <div className="relative">
              <MuseFace size={96} className="mx-auto" />
              <h2 className="mt-6 font-display text-4xl sm:text-6xl font-semibold tracking-[-0.03em]">
                Your first post is one question away.
              </h2>
              <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/demo" className={buttonClasses('primary', 'lg')}>Start the demo →</Link>
                <Link href="/login" className={buttonClasses('secondary', 'lg')}>Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink bg-paper-deep">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-soft">
          <Logo />
          <p>© {new Date().getFullYear()} Attntion. For people with something to say.</p>
        </div>
      </footer>
    </div>
  )
}
