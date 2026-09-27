'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NICHE_MAP } from '@/types'
import Button from '@/components/ui/Button'
import Input, { Field } from '@/components/ui/Input'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import ProfessionPicker from '@/components/onboarding/ProfessionPicker'

export default function OnboardingStep1() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [profession, setProfession] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profession) {
      setError('Pick the role that fits you best.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: saveError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      profession,
      company,
      niche: profession,
      linkedin_niche_slug: NICHE_MAP[profession] || NICHE_MAP.Other,
    })

    setLoading(false)
    if (saveError) {
      setError(
        saveError.code === '42P01' || saveError.message.includes('does not exist')
          ? 'The database is not set up yet. Run supabase/schema.sql in the Supabase SQL editor, then try again.'
          : saveError.message
      )
      return
    }
    router.push('/onboarding/goals')
  }

  return (
    <OnboardingShell step={1} title="Hello. I'm your muse." subtitle="Tell me who I'm painting. This shapes every question I ask.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <Field label="Your name">
          <Input placeholder="Priya Nair" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
        </Field>
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold">What do you do?</span>
          <ProfessionPicker value={profession} onChange={setProfession} />
        </div>
        <Field label="Company or brand">
          <Input placeholder="Loop Studio" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </Field>
        {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto sm:self-start">
          Continue →
        </Button>
      </form>
    </OnboardingShell>
  )
}
