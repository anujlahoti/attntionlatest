'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import StepIndicator from '@/components/onboarding/StepIndicator'

export default function OnboardingBrand() {
  const router = useRouter()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [loadingLabel, setLoadingLabel] = useState('')

  async function finishAndGoToDashboard() {
    // Fire the (potentially 60s+) niche intelligence job without blocking navigation.
    fetch('/api/intelligence/run', { method: 'POST' }).catch(() => {})
    router.push('/dashboard')
  }

  async function handleExtract() {
    if (!websiteUrl) return handleSkip()

    setLoadingLabel('Analysing your brand...')
    await fetch('/api/onboarding/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl }),
    })

    setLoadingLabel('Studying your niche...')
    await finishAndGoToDashboard()
  }

  async function handleSkip() {
    setLoadingLabel('Setting things up...')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id)
    }
    await finishAndGoToDashboard()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <StepIndicator step={3} total={3} />
        <h1 className="font-syne text-2xl font-bold mt-6">Drop your website (optional).</h1>
        <p className="mt-1 text-zinc-400 text-sm">
          We&apos;ll extract your brand tone so posts sound like you.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <Input
            placeholder="https://yourcompany.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={!!loadingLabel}
          />

          {loadingLabel ? (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 py-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {loadingLabel}
            </div>
          ) : (
            <>
              <Button size="lg" onClick={handleExtract} className="w-full">
                Extract &amp; finish
              </Button>
              <Button size="lg" variant="ghost" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
