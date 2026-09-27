'use client'

import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { currentWeekOf } from '@/lib/week'
import SessionFlow, { SessionAdapter } from '@/components/session/SessionFlow'
import AppHeader from '@/components/dashboard/AppHeader'

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed')
  return res.json()
}

export default function SessionPage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<{ id: string; full_name?: string; profession?: string; company?: string; niche?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('id, full_name, profession, company, niche').eq('id', user.id).single()
      setProfile(data ?? { id: user.id })
    })
  }, [supabase])

  const adapter = useMemo<SessionAdapter | null>(() => {
    if (!profile) return null
    const weekOf = currentWeekOf()
    // Filled in by load(); read by the later steps of the flow.
    const current = { sessionId: '', photoPath: null as string | null }

    return {
      userName: profile.full_name || 'You',
      headline: [profile.profession, profile.company].filter(Boolean).join(' · '),
      exitHref: '/dashboard',
      exitLabel: 'Back to dashboard',

      async load() {
        const fetchSession = () =>
          supabase.from('weekly_sessions').select('*').eq('user_id', profile.id).eq('week_of', weekOf).maybeSingle()

        let { data: session } = await fetchSession()
        if (!session) {
          await postJSON('/api/intelligence/run', {})
          ;({ data: session } = await fetchSession())
        }
        if (!session) throw new Error('Could not create this week’s session. Check that the database schema is set up.')

        current.sessionId = session.id
        current.photoPath = session.photo_path || null

        const { data: intel } = await supabase
          .from('niche_intelligence')
          .select('winning_format, topic_clusters')
          .eq('niche', profile.niche)
          .eq('week_of', weekOf)
          .maybeSingle()

        let photoUrl: string | null = null
        if (current.photoPath) {
          const { data: signed } = await supabase.storage.from('session-files').createSignedUrl(current.photoPath, 60 * 60)
          photoUrl = signed?.signedUrl || null
        }

        return {
          question: session.question || '',
          winningFormat: intel?.winning_format,
          transcript: session.transcript || '',
          draftPost: session.final_post || session.draft_post || '',
          photoUrl,
          published: session.status === 'published',
        }
      },

      async transcribe(audio, filename) {
        const form = new FormData()
        form.append('audio', audio, filename)
        form.append('sessionId', current.sessionId)
        const res = await fetch('/api/session/transcribe', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Transcription failed')
        return (await res.json()).transcript
      },

      async generate(transcript) {
        const { draftPost, preview } = await postJSON<{ draftPost: string; preview?: boolean }>('/api/session/generate', {
          sessionId: current.sessionId,
          transcript,
        })
        return { post: draftPost, preview }
      },

      async uploadPhoto(file) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${profile.id}/${current.sessionId}/photo.${ext}`
        const { error } = await supabase.storage.from('session-files').upload(path, file, { upsert: true })
        if (error) throw error
        current.photoPath = path
        await supabase.from('weekly_sessions').update({ photo_path: path }).eq('id', current.sessionId)
        return URL.createObjectURL(file)
      },

      async removePhoto() {
        current.photoPath = null
        await supabase.from('weekly_sessions').update({ photo_path: null }).eq('id', current.sessionId)
      },

      publish(post) {
        return postJSON('/api/session/publish', { sessionId: current.sessionId, finalPost: post, photoPath: current.photoPath })
      },

      async markPosted(post) {
        await postJSON('/api/session/publish', { sessionId: current.sessionId, finalPost: post, markPosted: true })
      },
    }
  }, [profile, supabase])

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10">
        {adapter ? <SessionFlow adapter={adapter} /> : null}
      </main>
    </div>
  )
}
