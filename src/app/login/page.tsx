'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { supabaseConfigured } from '@/lib/supabase/env'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'
import MuseFace from '@/components/ui/MuseFace'
import { LineDove, Placard, Plane } from '@/components/ui/Art'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) {
      setError('Sign-in is not switched on yet. Try the demo in the meantime.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(
        error.status === 429
          ? 'Too many sign-in emails were sent recently. Wait a few minutes, or try the demo in the meantime.'
          : error.message
      )
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-cobalt text-paper border-r-2 border-ink p-10">
        <Logo light />
        <Plane shape="quarter" color="#e9b23c" size={260} rotate={180} className="absolute -right-14 -top-14" />
        <Plane shape="circle" color="#eba59c" size={110} className="absolute left-16 bottom-28" />
        <div className="relative">
          <LineDove className="w-64 [&_path]:stroke-paper [&_circle]:fill-paper" />
          <p className="mt-6 max-w-md font-display text-4xl leading-tight italic">
            &ldquo;Every child is an artist. The problem is how to remain an artist once we grow up.&rdquo;
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-paper/75">Attributed to Pablo Picasso</p>
        </div>
        <p className="relative text-sm text-paper/80">Your weekly LinkedIn muse.</p>
      </aside>

      <main className="flex flex-col px-4 sm:px-10 py-6">
        <div className="lg:hidden"><Logo /></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm py-12 fade-up">
            <MuseFace size={96} state={loading ? 'thinking' : 'idle'} />

            {sent ? (
              <>
                <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">Check your inbox.</h1>
                <p className="mt-3 text-ink-soft">
                  We sent a sign-in link to <strong>{email}</strong>. Open it on this device to step into your studio.
                </p>
                <Button variant="ghost" className="mt-6" onClick={() => setSent(false)}>
                  Use a different email
                </Button>
              </>
            ) : (
              <>
                <Placard className="mt-8">Enter the studio</Placard>
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Welcome to attntion.</h1>
                <p className="mt-2 text-ink-soft">Seven minutes. One LinkedIn post. Every week.</p>

                <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    aria-label="Email"
                  />
                  {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    Send my magic link
                  </Button>
                </form>
                <p className="mt-3 text-xs text-muted">No password needed. We email you a one-tap link.</p>

                <div className="mt-10 border-t-2 border-dashed border-ink/25 pt-6">
                  <Link href="/demo" className="text-sm font-semibold text-cobalt underline decoration-2 underline-offset-4 decoration-ochre hover:decoration-cobalt">
                    Or try the full flow without an account →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
