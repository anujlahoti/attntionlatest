'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import GoalPicker from '@/components/onboarding/GoalPicker'

export default function OnboardingGoals() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id].slice(0, 3)
    )
  }

  async function handleContinue() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ goals: selected }).eq('id', user.id)
    }
    setLoading(false)
    router.push('/onboarding/brand')
  }

  return (
    <OnboardingShell step={2} title="What should LinkedIn do for you?" subtitle="Pick up to three. I'll steer every post toward them.">
      <GoalPicker selected={selected} onToggle={toggle} />
      <div className="mt-10 flex gap-4">
        <Button variant="secondary" size="lg" onClick={() => router.push('/onboarding')}>
          ← Back
        </Button>
        <Button onClick={handleContinue} size="lg" loading={loading} disabled={selected.length === 0}>
          Continue →
        </Button>
      </div>
    </OnboardingShell>
  )
}
