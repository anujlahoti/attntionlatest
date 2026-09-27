'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import { Typing } from '@/components/session/Bubbles'

export default function OnboardingBrand() {
  const router = useRouter()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [loadingLabel, setLoadingLabel] = useState('')

  async function finish(url: string) {
    setLoadingLabel(url ? 'Reading your website…' : 'Preparing your studio…')
    await fetch('/api/onboarding/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: url }),
    })

    router.push('/onboarding/profile')
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
              Learn my brand &amp; continue →
            </Button>
            <Button size="lg" variant="ghost" onClick={() => finish('')}>
              Skip for now
            </Button>
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}
