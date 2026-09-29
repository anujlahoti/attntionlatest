'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Button, { buttonClasses } from '@/components/ui/Button'
import Input, { Field } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Typing } from '@/components/session/Bubbles'
import Logo from '@/components/ui/Logo'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import RoleIndustryPicker from '@/components/onboarding/RoleIndustryPicker'
import GoalPicker from '@/components/onboarding/GoalPicker'
import SessionFlow, { SessionAdapter } from '@/components/session/SessionFlow'
import { saveHandoff } from '@/lib/demo-handoff'
import { PROFILE_CARDS } from '@/lib/profile'
import { BrandContext } from '@/types'

interface DemoProfile {
  name: string
  company: string
  role?: string
  industry?: string
  goals: string[]
  brandContext: BrandContext
}

const MAX_SWAPS = 3

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export default function DemoPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [profile, setProfile] = useState<DemoProfile>({ name: '', company: '', goals: [], brandContext: {} })
  const [website, setWebsite] = useState('')
  const [readingSite, setReadingSite] = useState(false)

  const roleLabel = PROFILE_CARDS[0].options!.find((o) => o.value === profile.role)?.label

  const adapter = useMemo<SessionAdapter | null>(() => {
    if (step !== 4) return null
    // Filled in as the flow runs; read by later steps and by the account handoff.
    const state = { winningFormat: '', winningHook: '', topicClusters: [] as string[], question: '', swaps: 0 }
    // Everything the demo APIs need to write for this visitor.
    const who = {
      name: profile.name,
      profession: roleLabel,
      profile_type: profile.role,
      industry: profile.industry,
      goals: profile.goals,
      brandContext: profile.brandContext,
    }
    const handoffProfile = {
      name: profile.name,
      company: profile.company,
      profile_type: profile.role,
      industry: profile.industry,
      goals: profile.goals,
      website,
    }

    return {
      userName: profile.name || 'You',
      headline: [roleLabel, profile.company].filter(Boolean).join(' · '),
      exitHref: '/login',
      exitLabel: 'Save my progress with an account',

      async load() {
        const intel = await postJSON<{
          question: string
          winningFormat: string
          winningHook: string
          insight: string
          topicClusters: string[]
        }>('/api/demo/question', who)
        Object.assign(state, {
          winningFormat: intel.winningFormat,
          winningHook: intel.winningHook,
          topicClusters: intel.topicClusters ?? [],
          question: intel.question,
        })
        saveHandoff({ profile: handoffProfile, question: intel.question })
        return { question: intel.question, winningFormat: intel.winningFormat, insight: intel.insight, swapsLeft: MAX_SWAPS }
      },

      async transcribe(audio, filename) {
        const form = new FormData()
        form.append('audio', audio, filename)
        const res = await fetch('/api/demo/transcribe', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Transcription failed')
        return (await res.json()).transcript
      },

      followUp(answer) {
        return postJSON('/api/demo/follow-up', { ...who, question: state.question, answer })
      },

      async swapQuestion() {
        state.swaps += 1
        const r = await postJSON<{ question: string }>('/api/demo/question', { ...who, variant: state.swaps, previous: state.question })
        state.question = r.question
        saveHandoff({ profile: handoffProfile, question: r.question })
        return { question: r.question, swapsLeft: MAX_SWAPS - state.swaps }
      },

      async generate(transcript) {
        const { draftPost, preview } = await postJSON<{ draftPost: string; preview?: boolean }>('/api/demo/generate', {
          transcript,
          ...who,
          winningFormat: state.winningFormat,
          winningHook: state.winningHook,
          topicClusters: state.topicClusters,
        })
        // Kept so "Save my progress with an account" carries this draft over.
        saveHandoff({ profile: handoffProfile, question: state.question, transcript, draft: draftPost })
        return { post: draftPost, preview }
      },

      async anonymize(post) {
        return (await postJSON<{ post: string }>('/api/post/anonymize', { post })).post
      },

      async uploadPhoto(file) {
        return URL.createObjectURL(file)
      },

      async removePhoto() {},

      recommendPhoto(post) {
        return postJSON('/api/demo/photo-recommendation', { post, ...who })
      },

      async publish() {
        return {
          success: false,
          manual: true,
          message: 'In the demo, you publish by copy and paste. With an account, your muse can post for you.',
        }
      },

      async markPosted() {},
    }
  }, [step, profile, roleLabel, website])

  async function finishSetup(url: string) {
    if (url) {
      setReadingSite(true)
      try {
        const { brandContext } = await postJSON<{ brandContext: BrandContext }>('/api/demo/brand', { websiteUrl: url })
        setProfile((p) => ({ ...p, brandContext }))
      } catch {
        // Brand voice is optional — carry on without it.
      }
      setReadingSite(false)
    }
    setStep(4)
  }

  if (step === 1) {
    return (
      <OnboardingShell step={1} title="Hello. I'm your muse." subtitle="A live demo, no account needed. Who am I painting?">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (profile.role && profile.industry?.trim()) setStep(2)
          }}
          className="flex flex-col gap-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name">
              <Input
                placeholder="Priya Nair"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Company or brand" hint="(optional)">
              <Input placeholder="Loop Studio" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
            </Field>
          </div>
          <RoleIndustryPicker
            role={profile.role}
            industry={profile.industry}
            onRole={(role) => setProfile((p) => ({ ...p, role }))}
            onIndustry={(industry) => setProfile((p) => ({ ...p, industry }))}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button type="submit" size="lg" disabled={!profile.name || !profile.role || !profile.industry?.trim()}>
              Continue →
            </Button>
            <p className="text-sm text-ink-soft">
              Have an account? <Link href="/login" className="font-semibold text-cobalt underline decoration-ochre decoration-2 underline-offset-4">Sign in</Link>
            </p>
          </div>
        </form>
      </OnboardingShell>
    )
  }

  if (step === 2) {
    return (
      <OnboardingShell step={2} title="What should LinkedIn do for you?" subtitle="Pick up to three.">
        <GoalPicker
          selected={profile.goals}
          onToggle={(id) =>
            setProfile((p) => ({
              ...p,
              goals: p.goals.includes(id) ? p.goals.filter((g) => g !== id) : [...p.goals, id].slice(0, 3),
            }))
          }
        />
        <div className="mt-10 flex gap-4">
          <Button variant="secondary" size="lg" onClick={() => setStep(1)}>← Back</Button>
          <Button size="lg" disabled={!profile.goals.length} onClick={() => setStep(3)}>
            Continue →
          </Button>
        </div>
      </OnboardingShell>
    )
  }

  if (step === 3) {
    return (
      <OnboardingShell
        step={3}
        title="Where can I learn your voice?"
        subtitle="Drop your website and I'll pick up your tone and topics. Optional."
        thinking={readingSite}
      >
        <div className="flex flex-col gap-5">
          <Input
            placeholder="yourcompany.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={readingSite}
            inputMode="url"
            aria-label="Website"
          />
          {readingSite ? (
            <div className="canvas-card p-5 flex items-center gap-4 font-medium">
              <Typing />
              Reading your website…
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => finishSetup(website.trim())} disabled={!website.trim()}>
                Learn my brand &amp; get my question →
              </Button>
              <Button size="lg" variant="ghost" onClick={() => finishSetup('')}>
                Skip, show me my question
              </Button>
            </div>
          )}
        </div>
      </OnboardingShell>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b-2 border-ink">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <Logo />
          <Badge tone="ochre" className="hidden sm:inline-flex">Demo · your draft carries over if you sign up</Badge>
          <Link href="/login" className={buttonClasses('primary', 'sm')}>Create account</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10">
        {profile.brandContext.tone && (
          <p className="mb-8 text-center text-sm text-ink-soft">
            Painting in your brand voice: <em className="font-display text-base">{profile.brandContext.tone}</em>
          </p>
        )}
        {adapter && <SessionFlow adapter={adapter} />}
      </main>
    </div>
  )
}
