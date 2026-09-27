'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-syne text-3xl font-extrabold bg-gradient-to-r from-[#00E8D0] to-[#C8FF00] bg-clip-text text-transparent">
          attntion
        </h1>
        <p className="mt-2 text-zinc-400">
          7 minutes. One LinkedIn post. Every week.
        </p>

        {sent ? (
          <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-white font-medium">Check your inbox.</p>
            <p className="mt-1 text-sm text-zinc-400">
              We sent a magic link to {email}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-400 text-left">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Send magic link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
