'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEEP_PROFILE_FIELDS, DeepProfile } from '@/lib/profile'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import DeepProfileQuiz from '@/components/onboarding/DeepProfileQuiz'

function ProfileStep() {
  const router = useRouter()
  // Opened from Settings to retake the quiz: go back there afterwards.
  const fromSettings = useSearchParams().get('from') === 'settings'
  const [initial, setInitial] = useState<DeepProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      const existing: DeepProfile = {}
      for (const field of DEEP_PROFILE_FIELDS) {
        if (data?.[field] != null) (existing as Record<string, unknown>)[field] = data[field]
      }
      setInitial(existing)
    })
  }, [router])

  async function save(profile: DeepProfile) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    // Write every field, so answers to cards that no longer apply are cleared.
    const fields = Object.fromEntries(
      DEEP_PROFILE_FIELDS.map((f) => [f, profile[f] ?? (f === 'content_angles' || f === 'target_audience' ? [] : null)])
    )
    const { error: saveError } = await supabase
      .from('users')
      .update({ ...fields, onboarding_complete: true })
      .eq('id', user.id)

    if (saveError) {
      setSaving(false)
      setError(
        /column|schema cache/i.test(saveError.message)
          ? 'The database needs one update first: run supabase/patch-002-deep-profile.sql in the Supabase SQL editor, then tap again.'
          : saveError.message
      )
      return
    }

    if (fromSettings) {
      router.push('/settings')
      return
    }
    // Fire the (potentially 60s+) weekly study without blocking navigation.
    fetch('/api/intelligence/run', { method: 'POST' }).catch(() => {})
    router.push('/dashboard')
  }

  return (
    <OnboardingShell
      step={4}
      title="Now the fun part."
      subtitle="Seven quick taps so I can ask you questions only you can answer."
      thinking={saving}
    >
      {initial ? (
        <DeepProfileQuiz
          initial={initial}
          saving={saving}
          error={error}
          finishLabel={fromSettings ? 'Save my profile' : undefined}
          onComplete={save}
        />
      ) : (
        <div className="h-40 bg-paper-deep border-2 border-ink/20 animate-pulse cut" />
      )}
    </OnboardingShell>
  )
}

export default function OnboardingProfile() {
  return (
    <Suspense>
      <ProfileStep />
    </Suspense>
  )
}
