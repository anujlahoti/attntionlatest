'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NICHE_MAP } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import StepIndicator from '@/components/onboarding/StepIndicator'

export default function OnboardingStep1() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [profession, setProfession] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      profession,
      company,
      niche: profession,
      linkedin_niche_slug: NICHE_MAP[profession] || NICHE_MAP.Other,
    })

    setLoading(false)
    router.push('/onboarding/goals')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <StepIndicator step={1} total={3} />
        <h1 className="font-syne text-2xl font-bold mt-6">Tell us about yourself.</h1>
        <p className="mt-1 text-zinc-400 text-sm">This shapes everything Attntion writes for you.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00E8D0] focus:outline-none rounded-lg px-4 py-3 text-white"
          >
            <option value="" disabled>Select your profession</option>
            {Object.keys(NICHE_MAP).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <Input
            placeholder="Company / brand name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
