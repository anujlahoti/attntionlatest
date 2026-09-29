'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import { Typing } from '@/components/session/Bubbles'
import { readHandoff } from '@/lib/demo-handoff'

export default function OnboardingBrand() {
  const router = useRouter()
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Arriving from the demo: reuse the website they gave there.
  useEffect(() => {
    const website = readHandoff()?.profile.website
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill from browser storage
    if (website) setWebsiteUrl(website)
  }, [])
  const [loadingLabel, setLoadingLabel] = useState('')

  async function finish(url: string) {
    setLoadingLabel(url ? 'Reading your website…' : 'Preparing your studio…')
    await fetch('/api/onboarding/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: url }),
    })

    // Straight to the first question: the session page studies the niche and asks.
    router.push('/session')
  }

  return (
    <OnboardingShell
      step={3}
      title="Where can I learn your voice?"
      subtitle="Drop your website and I'll pick up your tone, topics and positioning. Optional."
      thinking={!!loadingLabel}
    >
      <div className="flex flex-col gap-5">
        <Input
          placeholder="yourcompany.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          disabled={!!loadingLabel}
          inputMode="url"
          aria-label="Website"
        />

        {loadingLabel ? (
          <div className="canvas-card p-5 flex items-center gap-4 font-medium">
            <Typing />
            {loadingLabel}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => finish(websiteUrl.trim())} disabled={!websiteUrl.trim()}>
              Learn my brand &amp; get my question →
            </Button>
            <Button size="lg" variant="ghost" onClick={() => finish('')}>
              Skip, show me my question
            </Button>
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}
