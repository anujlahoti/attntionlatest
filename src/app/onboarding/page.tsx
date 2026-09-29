'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { identityFields } from '@/lib/profile'
import { readHandoff } from '@/lib/demo-handoff'
import Button from '@/components/ui/Button'
import Input, { Field } from '@/components/ui/Input'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import RoleIndustryPicker from '@/components/onboarding/RoleIndustryPicker'

export default function OnboardingStep1() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState<string>()
  const [industry, setIndustry] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Arriving from the demo: start from what they already told us.
  useEffect(() => {
    const handoff = readHandoff()
    if (!handoff) return
    const p = handoff.profile
    /* eslint-disable react-hooks/set-state-in-effect -- one-time prefill from browser storage */
    if (p.name) setFullName(p.name)
    if (p.company) setCompany(p.company)
    if (p.profile_type) setRole(p.profile_type)
    if (p.industry) setIndustry(p.industry)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!role || !industry?.trim()) {
      setError('Pick your role and industry. They decide what your muse studies each week.')
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
      company,
      ...identityFields(role, industry),
    })

    setLoading(false)
    if (saveError) {
      setError(
        saveError.code === '42P01' || /does not exist|column/i.test(saveError.message)
          ? 'The database needs an update: run supabase/schema.sql and the patch files in the Supabase SQL editor, then try again.'
          : saveError.message
      )
      return
    }
    router.push('/onboarding/goals')
  }

  return (
    <OnboardingShell step={1} title="Hello. I'm your muse." subtitle="Tell me who I'm painting. This shapes every question I ask.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name">
            <Input placeholder="Priya Nair" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
          </Field>
          <Field label="Company or brand" hint="(optional)">
            <Input placeholder="Loop Studio" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
        </div>
        <RoleIndustryPicker role={role} industry={industry} onRole={setRole} onIndustry={setIndustry} />
        {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto sm:self-start">
          Continue →
        </Button>
      </form>
    </OnboardingShell>
  )
}
