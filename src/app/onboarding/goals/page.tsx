'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import StepIndicator from '@/components/onboarding/StepIndicator'
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <StepIndicator step={2} total={3} />
        <h1 className="font-syne text-2xl font-bold mt-6">
          What do you want LinkedIn to do for you?
        </h1>
        <p className="mt-1 text-zinc-400 text-sm">Pick up to 3.</p>

        <div className="mt-8">
          <GoalPicker selected={selected} onToggle={toggle} />
        </div>

        <Button
          onClick={handleContinue}
          size="lg"
          loading={loading}
          disabled={selected.length === 0}
          className="w-full mt-6"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
