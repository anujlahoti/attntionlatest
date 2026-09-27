'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import VoiceRecorder from '@/components/session/VoiceRecorder'
import PhotoUpload from '@/components/session/PhotoUpload'
import PostDraft from '@/components/session/PostDraft'
import PublishButton, { PublishResult } from '@/components/session/PublishButton'

type Step = 1 | 2 | 3 | 4

export default function SessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)

  const [userId, setUserId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [question, setQuestion] = useState('')
  const [winningFormat, setWinningFormat] = useState('')

  const [transcript, setTranscript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [draftPost, setDraftPost] = useState('')
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)

  const [publishing, setPublishing] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const weekOf = new Date().toISOString().split('T')[0]
      let { data: existing } = await supabase
        .from('weekly_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_of', weekOf)
        .maybeSingle()

      if (!existing) {
        await fetch('/api/intelligence/run', { method: 'POST' })
        const { data: created } = await supabase
          .from('weekly_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_of', weekOf)
          .maybeSingle()
        existing = created
      }

      if (existing) {
        setSessionId(existing.id)
        setQuestion(existing.question || '')
        setTranscript(existing.transcript || '')
        setDraftPost(existing.draft_post || existing.final_post || '')
        setPhotoPath(existing.photo_path || null)

        if (existing.photo_path) {
          const { data: signed } = await supabase.storage
            .from('session-files')
            .createSignedUrl(existing.photo_path, 60 * 60)
          setPhotoPreviewUrl(signed?.signedUrl || null)
        }

        const { data: profile } = await supabase
          .from('users')
          .select('niche')
          .eq('id', user.id)
          .single()

        const { data: intel } = await supabase
          .from('niche_intelligence')
          .select('winning_format')
          .eq('niche', profile?.niche)
          .eq('week_of', weekOf)
          .maybeSingle()

        setWinningFormat(intel?.winning_format || '')

        if (existing.draft_post || existing.final_post) {
          setStep(existing.photo_path ? 4 : 3)
        } else if (existing.transcript) {
          setStep(2)
          handleTranscribed(existing.transcript, existing.id)
        }
      }

      setLoading(false)
    }

    loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function handleTranscribed(text: string, sessionIdOverride?: string) {
    setTranscript(text)
    setGenerateError('')
    setGenerating(true)
    try {
      const res = await fetch('/api/session/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdOverride || sessionId }),
      })
      if (!res.ok) throw new Error('Generate failed')
      const { draftPost } = await res.json()
      setDraftPost(draftPost || '')
      setStep(3)
    } catch {
      setGenerateError('Could not turn that into a post. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function copyPost() {
    await navigator.clipboard.writeText(draftPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-[#00E8D0]" />
      </div>
    )
  }

  if (publishing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl">🎉</p>
          <h1 className="font-syne text-2xl font-bold mt-4">
            {publishing.success ? 'Posted. See you next week.' : 'Saved for you.'}
          </h1>
          {publishing.message && (
            <p className="mt-2 text-zinc-400 text-sm">{publishing.message}</p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            {publishing.success && publishing.postId && (
              <a
                href={`https://www.linkedin.com/feed/update/${publishing.postId}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" className="w-full">View on LinkedIn →</Button>
              </a>
            )}
            {!publishing.success && (
              <Button size="lg" onClick={copyPost} className="w-full">
                {copied ? 'Copied!' : 'Copy post'}
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {step === 1 && (
          <div className="text-center">
            <p className="text-2xl font-medium text-white">{question}</p>
            {winningFormat && (
              <div className="mt-6">
                <p className="text-sm text-zinc-400 mb-2">This week&apos;s winning format in your niche:</p>
                <Badge>{winningFormat}</Badge>
              </div>
            )}
            <Button size="lg" onClick={() => setStep(2)} className="mt-8">
              I&apos;m ready — start recording →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center gap-8">
            {!transcript ? (
              <VoiceRecorder sessionId={sessionId} onTranscribed={handleTranscribed} />
            ) : (
              <div className="w-full">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={8}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00E8D0] focus:outline-none rounded-lg px-4 py-3 text-white resize-none"
                />
                {generating && (
                  <p className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Turning that into a post...
                  </p>
                )}
                {generateError && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="text-sm text-red-400">{generateError}</p>
                    <Button onClick={() => handleTranscribed(transcript)}>Try again</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h1 className="font-syne text-2xl font-bold">Add a photo.</h1>
            <p className="mt-1 text-zinc-400 text-sm max-w-sm mx-auto">
              Real photos perform 3x better on LinkedIn. Take one now or upload from your camera roll.
            </p>
            <div className="mt-8 max-w-sm mx-auto">
              <PhotoUpload
                userId={userId}
                sessionId={sessionId}
                onUploaded={(path, previewUrl) => {
                  setPhotoPath(path)
                  setPhotoPreviewUrl(previewUrl)
                }}
              />
            </div>
            <Button size="lg" onClick={() => setStep(4)} disabled={!photoPath} className="mt-6">
              Next →
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h1 className="font-syne text-2xl font-bold mb-4">Review your post.</h1>
              <PostDraft value={draftPost} onChange={setDraftPost} />
            </div>
            <div>
              {photoPreviewUrl && (
                <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-4">
                  <img
                    src={photoPreviewUrl}
                    alt="Selected"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <PublishButton
                sessionId={sessionId}
                finalPost={draftPost}
                photoPath={photoPath}
                onResult={setPublishing}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
