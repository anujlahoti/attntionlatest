'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BrandContext, NICHE_MAP } from '@/types'
import AppHeader from '@/components/dashboard/AppHeader'
import Button from '@/components/ui/Button'
import Input, { Field } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Placard } from '@/components/ui/Art'
import ProfessionPicker from '@/components/onboarding/ProfessionPicker'
import GoalPicker from '@/components/onboarding/GoalPicker'

interface Profile {
  id: string
  email: string
  full_name: string
  profession: string
  company: string
  website_url: string
  brand_context: BrandContext
  goals: string[]
  blotato_linkedin_profile_id: string
}

type Saving = '' | 'profile' | 'goals' | 'brand' | 'linkedin'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState<Saving>('')
  const [saved, setSaved] = useState<Saving>('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Created in effects/handlers (browser only) so the page can be prerendered without env vars.
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile({
        id: user.id,
        email: user.email ?? '',
        full_name: data?.full_name ?? '',
        profession: data?.profession ?? '',
        company: data?.company ?? '',
        website_url: data?.website_url ?? '',
        brand_context: data?.brand_context ?? {},
        goals: data?.goals ?? [],
        blotato_linkedin_profile_id: data?.blotato_linkedin_profile_id ?? '',
      })
    })
  }, [])

  async function save(section: Saving, fields: Record<string, unknown>) {
    if (!profile) return
    setSaving(section)
    setError('')
    const { error: saveError } = await createClient().from('users').update(fields).eq('id', profile.id)
    setSaving('')
    if (saveError) {
      setError(saveError.message)
      return
    }
    setSaved(section)
    setTimeout(() => setSaved(''), 2000)
  }

  async function rescanBrand() {
    if (!profile?.website_url) return
    setSaving('brand')
    const res = await fetch('/api/onboarding/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: profile.website_url }),
    })
    const { brandContext } = await res.json().catch(() => ({ brandContext: {} }))
    setProfile((p) => (p ? { ...p, brand_context: brandContext ?? {} } : p))
    setSaving('')
    setSaved('brand')
    setTimeout(() => setSaved(''), 2000)
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
          <div className="h-12 w-72 bg-paper-deep border-2 border-ink/20 animate-pulse" />
        </main>
      </div>
    )
  }

  const update = (fields: Partial<Profile>) => setProfile({ ...profile, ...fields })
  const savedLabel = (section: Saving) => (saved === section ? '✓ Saved' : 'Save')

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Placard>Settings</Placard>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.03em]">
          Tune your <em className="text-cobalt">muse.</em>
        </h1>
        <p className="mt-2 text-ink-soft">Signed in as {profile.email}</p>
        {error && <p className="mt-4 text-sm font-medium text-terracotta">{error}</p>}

        <div className="mt-10 flex flex-col gap-10">
          <Section numeral="I" title="The subject" subtitle="Who your muse is writing for.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name">
                <Input value={profile.full_name} onChange={(e) => update({ full_name: e.target.value })} />
              </Field>
              <Field label="Company or brand">
                <Input value={profile.company} onChange={(e) => update({ company: e.target.value })} />
              </Field>
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <span className="text-sm font-semibold">Profession <span className="font-normal text-muted">(sets your niche)</span></span>
              <ProfessionPicker value={profile.profession} onChange={(profession) => update({ profession })} />
            </div>
            <Button
              className="mt-6"
              loading={saving === 'profile'}
              onClick={() =>
                save('profile', {
                  full_name: profile.full_name,
                  company: profile.company,
                  profession: profile.profession,
                  niche: profile.profession,
                  linkedin_niche_slug: NICHE_MAP[profile.profession] || NICHE_MAP.Other,
                })
              }
            >
              {savedLabel('profile')}
            </Button>
          </Section>

          <Section numeral="II" title="The purpose" subtitle="Up to three goals. Every post leans toward them.">
            <GoalPicker
              selected={profile.goals}
              onToggle={(id) =>
                update({
                  goals: profile.goals.includes(id)
                    ? profile.goals.filter((g) => g !== id)
                    : [...profile.goals, id].slice(0, 3),
                })
              }
            />
            <Button className="mt-6" loading={saving === 'goals'} disabled={!profile.goals.length} onClick={() => save('goals', { goals: profile.goals })}>
              {savedLabel('goals')}
            </Button>
          </Section>

          <Section numeral="III" title="The voice" subtitle="Your muse reads your website to match your brand tone.">
            <Field label="Website">
              <Input value={profile.website_url} placeholder="yourcompany.com" onChange={(e) => update({ website_url: e.target.value })} />
            </Field>
            {profile.brand_context?.tone && (
              <div className="mt-5 bg-paper-deep border-2 border-ink cut-sm p-4 text-sm">
                <p><span className="font-semibold">Tone:</span> <em className="font-display text-base">{profile.brand_context.tone}</em></p>
                {profile.brand_context.tagline && <p className="mt-1"><span className="font-semibold">Tagline:</span> {profile.brand_context.tagline}</p>}
                {profile.brand_context.key_topics?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.brand_context.key_topics.map((t) => <Badge key={t}>{t}</Badge>)}
                  </div>
                ) : null}
              </div>
            )}
            <Button className="mt-6" loading={saving === 'brand'} disabled={!profile.website_url.trim()} onClick={rescanBrand}>
              {saved === 'brand' ? '✓ Voice updated' : 'Re-read my website'}
            </Button>
          </Section>

          <Section numeral="IV" title="Auto-posting" subtitle="Connect LinkedIn through Blotato so your muse can publish for you.">
            <ol className="text-sm text-ink-soft list-decimal pl-5 space-y-1">
              <li>Create a Blotato account and connect your LinkedIn.</li>
              <li>In Blotato, open Social Profiles → LinkedIn and copy the Profile ID.</li>
              <li>Paste it below. (The app also needs its <code className="font-mono text-xs">BLOTATO_API_KEY</code> set.)</li>
            </ol>
            <div className="mt-5">
              <Field label="Blotato LinkedIn profile ID">
                <Input
                  value={profile.blotato_linkedin_profile_id}
                  placeholder="e.g. 12345"
                  onChange={(e) => update({ blotato_linkedin_profile_id: e.target.value })}
                />
              </Field>
            </div>
            <Button
              className="mt-6"
              loading={saving === 'linkedin'}
              onClick={() => save('linkedin', { blotato_linkedin_profile_id: profile.blotato_linkedin_profile_id.trim() || null })}
            >
              {savedLabel('linkedin')}
            </Button>
          </Section>
        </div>
      </main>
    </div>
  )
}

function Section({
  numeral,
  title,
  subtitle,
  children,
}: {
  numeral: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="canvas-card p-6 sm:p-8">
      <p className="font-display italic text-terracotta text-lg">{numeral}.</p>
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}
