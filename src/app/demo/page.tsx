'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Button, { buttonClasses } from '@/components/ui/Button'
import Input, { Field } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Typing } from '@/components/session/Bubbles'
import Logo from '@/components/ui/Logo'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import ProfessionPicker from '@/components/onboarding/ProfessionPicker'
import GoalPicker from '@/components/onboarding/GoalPicker'
import SessionFlow, { SessionAdapter } from '@/components/session/SessionFlow'
import DeepProfileQuiz from '@/components/onboarding/DeepProfileQuiz'
import { DeepProfile } from '@/lib/profile'
import { BrandContext } from '@/types'

interface DemoProfile {
  name: string
  profession: string
  company: string
  goals: string[]
  brandContext: BrandContext
  deep: DeepProfile
}

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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [profile, setProfile] = useState<DemoProfile>({
    name: '',
    profession: '',
    company: '',
    goals: [],
    brandContext: {},
    deep: {},
  })
  const [website, setWebsite] = useState('')
  const [readingSite, setReadingSite] = useState(false)

  const adapter = useMemo<SessionAdapter | null>(() => {
    if (step !== 5) return null
    // Filled in by load(); used when drafting the post.
    const intelRef = { winningFormat: '', winningHook: '', topicClusters: [] as string[] }
    // Everything the demo APIs need to write for this visitor.
    const who = {
      name: profile.name,
      profession: profile.profession,
      goals: profile.goals,
      brandContext: profile.brandContext,
      ...profile.deep,
    }

    return {
      userName: profile.name || 'You',
      headline: [profile.profession, profile.company].filter(Boolean).join(' · '),
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
        intelRef.winningFormat = intel.winningFormat
        intelRef.winningHook = intel.winningHook
        intelRef.topicClusters = intel.topicClusters ?? []
        return { question: intel.question, winningFormat: intel.winningFormat, insight: intel.insight }
      },

      async transcribe(audio, filename) {
        const form = new FormData()
        form.append('audio', audio, filename)
        const res = await fetch('/api/demo/transcribe', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Transcription failed')
        return (await res.json()).transcript
      },

      async generate(transcript) {
        const { draftPost, preview } = await postJSON<{ draftPost: string; preview?: boolean }>('/api/demo/generate', {
          transcript,
          ...who,
          ...intelRef,
        })
        return { post: draftPost, preview }
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
          message: 'In the demo, you publish by copy and paste. With an account, Muse can post for you.',
        }
      },

      async markPosted() {},
    }
  }, [step, profile])

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
      <OnboardingShell step={1} total={4} title="Hello. I'm your muse." subtitle="A live demo, no account needed. Who am I painting?">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (profile.profession) setStep(2)
          }}
          className="flex flex-col gap-7"
        >
          <Field label="Your name">
            <Input
              placeholder="Priya Nair"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
              autoFocus
            />
          </Field>
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-semibold">What do you do?</span>
            <ProfessionPicker value={profile.profession} onChange={(profession) => setProfile({ ...profile, profession })} />
          </div>
          <Field label="Company or brand" hint="(optional)">
            <Input
              placeholder="Loop Studio"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            />
          </Field>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Button type="submit" size="lg" disabled={!profile.name || !profile.profession}>
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
      <OnboardingShell step={2} total={4} title="What should LinkedIn do for you?" subtitle="Pick up to three.">
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
        total={4}
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
                Learn my brand &amp; start →
              </Button>
              <Button size="lg" variant="ghost" onClick={() => finishSetup('')}>
                Skip, just start
              </Button>
            </div>
          )}
        </div>
      </OnboardingShell>
    )
  }

  if (step === 4) {
    return (
      <OnboardingShell step={4} title="Now the fun part." subtitle="Seven quick taps so I can ask you questions only you can answer.">
        <DeepProfileQuiz
          initial={profile.deep}
          onComplete={(deep) => {
            setProfile((p) => ({ ...p, deep }))
            setStep(5)
          }}
        />
      </OnboardingShell>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b-2 border-ink">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <Logo />
          <Badge tone="ochre" className="hidden sm:inline-flex">Demo · nothing is saved</Badge>
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
