'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Button, { buttonClasses } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import MuseFace from '@/components/ui/MuseFace'
import { Plane } from '@/components/ui/Art'
import { Textarea } from '@/components/ui/Input'
import { MuseBubble, Typing, UserBubble } from './Bubbles'
import LinkedInPreview from './LinkedInPreview'
import VoiceRecorder from './VoiceRecorder'
import PhotoRecCard from './PhotoRecCard'
import SafetyCard from './SafetyCard'
import StrategyCard from './StrategyCard'
import type { StrategyBrief } from '@/lib/strategist'
import { checkPost } from '@/lib/safety'
import { PhotoRecommendation } from '@/types'

export interface PublishResult {
  success: boolean
  manual?: boolean
  message?: string
  postId?: string
}

export interface SessionSnapshot {
  question: string
  winningFormat?: string
  insight?: string
  transcript?: string
  draftPost?: string
  photoUrl?: string | null
  published?: boolean
  swapsLeft?: number
}

// Everything the flow needs from the outside world. The signed-in app backs this
// with Supabase + API routes; the demo backs it with stateless /api/demo routes.
export interface SessionAdapter {
  userName: string
  headline?: string
  exitHref: string
  exitLabel: string
  load: () => Promise<SessionSnapshot>
  transcribe: (audio: Blob, filename: string) => Promise<string>
  generate: (transcript: string) => Promise<{ post: string; preview?: boolean; strategy?: StrategyBrief }>
  uploadPhoto: (file: File) => Promise<string>
  removePhoto: () => Promise<void>
  recommendPhoto: (post: string) => Promise<PhotoRecommendation & { preview?: boolean }>
  publish: (post: string) => Promise<PublishResult>
  markPosted: (post: string) => Promise<void>
  // Interview loop: one follow-up when the answer is too thin.
  followUp: (answer: string) => Promise<{ needed: boolean; question: string; suggestSwap: boolean }>
  // "Give me a different question" (limited per week); absent = not offered.
  swapQuestion?: () => Promise<{ question: string; swapsLeft: number }>
  // One-click anonymise for the "Before you post" check.
  anonymize: (post: string) => Promise<string>
  // Results loop: the published post's link (signed-in only).
  saveResults?: (results: { postUrl?: string }) => Promise<void>
  // Where to sharpen next week's question after posting (signed-in only).
  sharpenHref?: string
  track?: (name: string, props?: Record<string, unknown>) => void
}

// Words that suggest a mixed-language (e.g. Hinglish) answer.
const MIXED_LANGUAGE = /\b(yaar|hai|hain|maine|kya|nahi|bhi|abhi|kaam|karta|bolte|asli|baat)\b/i

type Stage = 'loading' | 'error' | 'question' | 'answer' | 'drafting' | 'review' | 'done'

const LINKEDIN_LIMIT = 3000

export default function SessionFlow({ adapter }: { adapter: SessionAdapter }) {
  const [stage, setStage] = useState<Stage>('loading')
  const [loadError, setLoadError] = useState('')
  const [snapshot, setSnapshot] = useState<SessionSnapshot>({ question: '' })
  const [answerMode, setAnswerMode] = useState<'voice' | 'text'>('voice')
  const [typed, setTyped] = useState('')
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [strategy, setStrategy] = useState<StrategyBrief | null>(null)
  const [editing, setEditing] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoRec, setPhotoRec] = useState<(PhotoRecommendation & { preview?: boolean }) | null>(null)
  const [photoRecLoading, setPhotoRecLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [markingPosted, setMarkingPosted] = useState(false)
  const [posted, setPosted] = useState(false)
  const [followUpQ, setFollowUpQ] = useState<string | null>(null)
  const [followUpSwap, setFollowUpSwap] = useState(false)
  const [followUpAsked, setFollowUpAsked] = useState(false)
  const [extra, setExtra] = useState('')
  const [checkingAnswer, setCheckingAnswer] = useState(false)
  const [swapsLeft, setSwapsLeft] = useState(3)
  const [swapping, setSwapping] = useState(false)
  const [safetyAck, setSafetyAck] = useState(false)
  const [anonymizing, setAnonymizing] = useState(false)
  const [postUrl, setPostUrl] = useState('')
  const [resultsSaved, setResultsSaved] = useState(false)
  const flags = useMemo(() => (draft ? checkPost(draft) : []), [draft])
  const blockingFlags = flags.some((f) => f.severity !== 'low') && !safetyAck
  const bottomRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function loadPhotoRec(post: string) {
    setPhotoRec(null)
    setPhotoRecLoading(true)
    try {
      setPhotoRec(await adapter.recommendPhoto(post))
    } catch {
      // The card still offers the upload button without a recommendation.
    } finally {
      setPhotoRecLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    adapter
      .load()
      .then((snap) => {
        if (cancelled) return
        setSnapshot(snap)
        setTranscript(snap.transcript || '')
        setDraft(snap.draftPost || '')
        setPhotoUrl(snap.photoUrl || null)
        if (typeof snap.swapsLeft === 'number') setSwapsLeft(snap.swapsLeft)
        adapter.track?.('question_shown')
        if (snap.published) {
          setPosted(true)
          setResult({ success: true })
          setStage('done')
        } else if (snap.draftPost) {
          setStage('review')
          if (!snap.photoUrl) loadPhotoRec(snap.draftPost)
        }
        else if (snap.transcript) setStage('answer')
        else setStage('question')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setLoadError(err.message || 'Could not load this week’s session.')
        setStage('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (stage !== 'loading') bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [stage, transcript, answerMode])

  async function runDraft(text: string) {
    setTranscript(text)
    setDraftError('')
    setStage('drafting')
    try {
      const { post, preview, strategy: brief } = await adapter.generate(text)
      setDraft(post)
      setIsPreview(!!preview)
      setStrategy(brief ?? null)
      setEditing(false)
      setStage('review')
      if (!photoUrl) loadPhotoRec(post)
    } catch {
      setDraftError('I could not turn that into a post just now. Give it another go.')
      setStage('answer')
    }
  }

  // One follow-up before drafting when the answer is too thin (asked once).
  async function requestDraft(text: string) {
    setTranscript(text)
    if (followUpAsked) return runDraft(text)
    setFollowUpAsked(true)
    setCheckingAnswer(true)
    try {
      const f = await adapter.followUp(text)
      if (f.needed && f.question) {
        setFollowUpQ(f.question)
        setFollowUpSwap(f.suggestSwap)
        return
      }
    } catch {
      // If the check fails, just draft.
    } finally {
      setCheckingAnswer(false)
    }
    runDraft(text)
  }

  function answerFollowUp(skip: boolean) {
    const full = skip || !extra.trim() ? transcript : `${transcript}\n\n${extra.trim()}`
    setFollowUpQ(null)
    setExtra('')
    runDraft(full)
  }

  async function swapQuestion() {
    if (!adapter.swapQuestion) return
    setSwapping(true)
    try {
      const r = await adapter.swapQuestion()
      setSnapshot((s) => ({ ...s, question: r.question }))
      setSwapsLeft(r.swapsLeft)
      setTranscript('')
      setTyped('')
      setFollowUpQ(null)
      setFollowUpAsked(false)
      setStage('question')
    } catch {
      setSwapsLeft(0)
    } finally {
      setSwapping(false)
    }
  }

  async function handleAnonymize() {
    setAnonymizing(true)
    try {
      setDraft(await adapter.anonymize(draft))
      adapter.track?.('safety_anonymised')
    } catch {
      // Leave the draft as is; the user can still edit by hand.
    } finally {
      setAnonymizing(false)
    }
  }

  async function saveResults() {
    if (!adapter.saveResults || !postUrl.trim()) return
    await adapter.saveResults({ postUrl: postUrl.trim() }).catch(() => {})
    setResultsSaved(true)
  }

  async function handlePhoto(file: File) {
    setPhotoError('')
    setPhotoBusy(true)
    try {
      setPhotoUrl(await adapter.uploadPhoto(file))
    } catch {
      setPhotoError('That photo did not upload. Try another one.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const r = await adapter.publish(draft)
      setResult(r)
      if (r.success) adapter.track?.('posted', { method: 'auto' })
    } catch {
      setResult({ success: false, manual: true, message: 'Something went wrong. Your post is saved, copy it below.' })
    } finally {
      setPublishing(false)
      setStage('done')
    }
  }

  async function copyAndOpenLinkedIn() {
    await navigator.clipboard.writeText(draft).catch(() => {})
    setCopied(true)
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(draft)}`, '_blank', 'noopener')
  }

  async function confirmPosted() {
    setMarkingPosted(true)
    await adapter.markPosted(draft).catch(() => {})
    setMarkingPosted(false)
    setPosted(true)
    adapter.track?.('posted', { method: 'manual' })
  }

  const hasAnswer = !!transcript && stage !== 'question'

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <MuseFace size={128} state="thinking" />
        <div>
          <p className="font-display text-2xl font-semibold">Studying your niche…</p>
          <p className="mt-1 text-sm text-muted">Reading this week&apos;s top posts and composing your question.</p>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <MuseFace size={88} />
        <p className="font-display text-2xl font-semibold">The paint didn&apos;t take</p>
        <p className="text-sm text-muted max-w-sm">{loadError}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7 pb-12">
      {/* I. The question */}
      <MuseBubble label="Your muse asks">
        {snapshot.winningFormat && (
          <Badge tone="ochre" className="mb-3">
            {snapshot.winningFormat} is winning this week
          </Badge>
        )}
        <p className="font-display text-2xl sm:text-[28px] leading-snug font-semibold tracking-tight">{snapshot.question}</p>
        {snapshot.insight && <p className="mt-3 text-sm text-muted">{snapshot.insight}</p>}
      </MuseBubble>

      {stage === 'question' && (
        <div className="flex flex-col sm:flex-row gap-3 sm:pl-14 fade-up">
          <Button size="lg" onClick={() => { setAnswerMode('voice'); setStage('answer') }}>
            🎙️ Answer with a voice note
          </Button>
          <Button size="lg" variant="secondary" onClick={() => { setAnswerMode('text'); setStage('answer') }}>
            Type instead
          </Button>
          {adapter.swapQuestion && swapsLeft > 0 && (
            <Button size="lg" variant="ghost" loading={swapping} onClick={swapQuestion}>
              ↻ Different question ({swapsLeft} left)
            </Button>
          )}
        </div>
      )}

      {/* II. The answer */}
      {stage === 'answer' && !transcript && (
        <div className="canvas-card p-5 sm:p-6 fade-up">
          {answerMode === 'voice' ? (
            <VoiceRecorder
              transcribe={adapter.transcribe}
              onTranscribed={(text) => {
                setTyped(text)
                setTranscript(text)
              }}
              onTypeInstead={() => setAnswerMode('text')}
            />
          ) : (
            <AnswerComposer
              value={typed}
              onChange={setTyped}
              onSubmit={() => requestDraft(typed.trim())}
              onVoice={() => setAnswerMode('voice')}
            />
          )}
        </div>
      )}

      {hasAnswer && <UserBubble>{transcript}</UserBubble>}

      {stage === 'answer' && transcript && followUpQ && (
        <>
          <MuseBubble label="One quick follow-up">
            <p className="font-display text-xl leading-snug font-semibold">{followUpQ}</p>
          </MuseBubble>
          <div className="canvas-card p-5 sm:p-6 fade-up">
            <Textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Add a line or two. A moment, a name for the role, a number."
            />
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              {followUpSwap && adapter.swapQuestion && swapsLeft > 0 && (
                <Button variant="ghost" loading={swapping} onClick={swapQuestion}>
                  ↻ Try a different question
                </Button>
              )}
              <Button variant="ghost" onClick={() => answerFollowUp(true)}>
                Skip, write it now
              </Button>
              <Button variant="accent" disabled={!extra.trim()} onClick={() => answerFollowUp(false)}>
                Add this &amp; paint →
              </Button>
            </div>
          </div>
        </>
      )}

      {stage === 'answer' && transcript && !followUpQ && (
        <div className="flex flex-col items-end gap-3 fade-up">
          {draftError && <p className="text-sm font-medium text-terracotta">{draftError}</p>}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTyped(transcript)
                setTranscript('')
                setAnswerMode('text')
              }}
            >
              Edit answer
            </Button>
            <Button variant="accent" loading={checkingAnswer} onClick={() => requestDraft(transcript)}>
              Paint my post →
            </Button>
          </div>
        </div>
      )}

      {stage === 'drafting' && (
        <MuseBubble state="thinking" label="Your muse is composing">
          <div className="flex items-center gap-3">
            <Typing />
            <span className="text-muted">Keeping your words, shaping the hook…</span>
          </div>
        </MuseBubble>
      )}

      {/* III. The canvas */}
      {(stage === 'review' || stage === 'done') && draft && (
        <>
          <MuseBubble>
            {stage === 'done'
              ? 'Here is what we hung on the wall this week.'
              : 'Here is your draft. I kept your phrasing and matched the winning format. Tweak anything, add a real photo, then post.'}
            {isPreview && stage === 'review' && (
              <p className="mt-3 border-l-4 border-ochre bg-ochre/15 px-3 py-2 text-xs text-ink-soft">
                <strong>Sketch mode.</strong> The AI strategist is offline, so a rule-based strategist restructured your answer
                into a proven story framework. The full strategist (sharper hooks, a clear takeaway for your audience, 150-300
                words, an editor pass) switches on once the AI has credits.
                {MIXED_LANGUAGE.test(transcript) && ' Your answer mixes languages; with AI on, I write it in English and keep your phrasing.'}
              </p>
            )}
          </MuseBubble>

          {stage === 'review' && strategy && !editing && (
            <div className="sm:pl-14">
              <StrategyCard
                strategy={strategy}
                currentHook={draft.split(/\n\s*\n/)[0] ?? ''}
                onUseHook={(hook) => setDraft([hook.replace(/…$/, '.'), ...draft.split(/\n\s*\n/).slice(1)].join('\n\n'))}
              />
            </div>
          )}

          <div className="sm:pl-14 fade-up">
            <div className="relative bg-paper-deep border-2 border-ink cut p-3 sm:p-5 shadow-ink">
              {editing ? (
                <div>
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={14} autoFocus />
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-medium ${draft.length > LINKEDIN_LIMIT ? 'text-terracotta' : 'text-muted'}`}>
                      {draft.length} / {LINKEDIN_LIMIT}
                    </span>
                    <Button size="sm" onClick={() => setEditing(false)}>Done editing</Button>
                  </div>
                </div>
              ) : (
                <LinkedInPreview name={adapter.userName} headline={adapter.headline} text={draft} imageUrl={photoUrl} />
              )}

              {stage === 'review' && !editing && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>✏️ Edit</Button>
                  <Button size="sm" variant="secondary" loading={photoBusy} onClick={() => photoInputRef.current?.click()}>
                    📷 {photoUrl ? 'Change photo' : 'Add photo'}
                  </Button>
                  {photoUrl && (
                    <Button size="sm" variant="ghost" onClick={() => { setPhotoUrl(null); adapter.removePhoto().catch(() => {}) }}>
                      Remove photo
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => runDraft(transcript)} disabled={!transcript}>
                    ↻ Rewrite
                  </Button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhoto(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              )}
              {photoError && <p className="mt-2 text-sm font-medium text-terracotta">{photoError}</p>}
            </div>
          </div>

          {stage === 'review' && !photoUrl && !editing && (
            <div className="sm:pl-14">
              <PhotoRecCard
                rec={photoRec}
                loading={photoRecLoading}
                uploading={photoBusy}
                onUpload={() => photoInputRef.current?.click()}
              />
            </div>
          )}

          {stage === 'review' && flags.length > 0 && !editing && (
            <div className="sm:pl-14">
              <SafetyCard
                flags={flags}
                anonymizing={anonymizing}
                acknowledged={safetyAck}
                onAnonymize={handleAnonymize}
                onAcknowledge={setSafetyAck}
              />
            </div>
          )}

          {stage === 'review' && (
            <div className="sm:pl-14 fade-up">
              <div className="bg-ochre border-2 border-ink cut-alt p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-ink-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 shrink-0 bg-surface border-2 border-ink rounded-full flex items-center justify-center font-bold">✓</div>
                  <div className="min-w-0">
                    <p className="font-semibold">Ready to hang</p>
                    <p className="text-xs text-ink-soft">
                      {blockingFlags
                        ? 'Check the "Before you post" notes first'
                        : `${draft.trim().split(/\s+/).length} words · ${photoUrl ? 'photo attached' : 'no photo yet (posts with one do better)'}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="linkedin"
                  size="lg"
                  loading={publishing}
                  disabled={!draft.trim() || draft.length > LINKEDIN_LIMIT || blockingFlags}
                  onClick={handlePublish}
                >
                  Post to LinkedIn
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* IV. Done */}
      {stage === 'done' && result && (
        <div className="fade-up">
          {result.success || posted ? (
            <div className="relative overflow-hidden bg-cobalt text-paper border-2 border-ink cut p-8 sm:p-10 text-center shadow-ink">
              <Plane shape="quarter" color="#e9b23c" size={140} className="absolute -top-6 -left-6" />
              <Plane shape="circle" color="#eba59c" size={90} className="absolute -bottom-6 right-6" />
              <div className="relative">
                <MuseFace size={84} className="mx-auto" />
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
                  Posted. <em>See you next week.</em>
                </h2>
                <p className="mt-2 text-paper/75">One more week of showing up. A fresh question will be waiting on Monday.</p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                  {result.postId && (
                    <a
                      href={`https://www.linkedin.com/feed/update/${result.postId}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses('accent', 'lg')}
                    >
                      View on LinkedIn →
                    </a>
                  )}
                  <Link href={adapter.exitHref} className={buttonClasses('secondary', 'lg')}>{adapter.exitLabel}</Link>
                </div>
                {adapter.saveResults && !result.postId && (
                  <div className="mt-8 mx-auto max-w-md text-left">
                    {resultsSaved ? (
                      <p className="text-center text-sm text-paper/85">✓ Saved. I&apos;ll ask how it did in a few days.</p>
                    ) : (
                      <>
                        <label className="text-xs font-bold uppercase tracking-[0.14em] text-paper/80">Paste your post&apos;s link (optional)</label>
                        <div className="mt-2 flex gap-2">
                          <input
                            value={postUrl}
                            onChange={(e) => setPostUrl(e.target.value)}
                            placeholder="https://www.linkedin.com/posts/…"
                            className="flex-1 h-11 px-3 bg-paper text-ink border-2 border-ink cut-sm text-sm"
                          />
                          <Button variant="accent" onClick={saveResults} disabled={!/linkedin\.com\//.test(postUrl)}>
                            Save
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {adapter.sharpenHref && (
                  <Link href={adapter.sharpenHref} className="mt-6 inline-block text-sm font-semibold underline decoration-ochre decoration-2 underline-offset-4">
                    Sharpen next week&apos;s question (60 seconds) →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="canvas-card p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <MuseFace size={52} />
                <div className="flex-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Your post is ready to hang</h2>
                  <p className="mt-1 text-muted text-sm">{result.message || 'Copy it and publish it on LinkedIn in one tap.'}</p>
                </div>
              </div>
              <ol className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
                {[
                  { n: 'I', text: 'Copy the post and open LinkedIn', bg: 'bg-rose' },
                  { n: 'II', text: `Paste${photoUrl ? ' and attach your photo' : ''}, then hit Post`, bg: 'bg-ochre' },
                  { n: 'III', text: 'Come back and mark it as posted', bg: 'bg-paper-deep' },
                ].map((s) => (
                  <li key={s.n} className={`${s.bg} border-2 border-ink cut-sm p-4`}>
                    <span className="font-display italic text-lg mr-1.5">{s.n}.</span>
                    {s.text}
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
                {photoUrl && (
                  <a href={photoUrl} download="attntion-photo.jpg" className={buttonClasses('secondary', 'lg')}>
                    ⬇ Download photo
                  </a>
                )}
                <Button variant="linkedin" size="lg" onClick={copyAndOpenLinkedIn}>
                  {copied ? '✓ Copied, LinkedIn opened' : 'Copy & open LinkedIn'}
                </Button>
                <Button size="lg" loading={markingPosted} onClick={confirmPosted} disabled={!copied}>
                  I&apos;ve posted it
                </Button>
                <Button variant="ghost" size="lg" onClick={() => { setResult(null); setStage('review') }}>
                  Back to draft
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function AnswerComposer({
  value,
  onChange,
  onSubmit,
  onVoice,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onVoice: () => void
}) {
  const tooShort = value.trim().length < 20
  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        autoFocus
        placeholder="Brain-dump like you're telling a friend. Specific moments, names, numbers. I'll do the rest."
      />
      <div className="flex items-center justify-between gap-3">
        <button onClick={onVoice} className="text-sm font-semibold text-cobalt underline decoration-2 underline-offset-4 decoration-ochre hover:decoration-cobalt">
          🎙️ Record instead
        </button>
        <Button variant="accent" onClick={onSubmit} disabled={tooShort}>
          Paint my post →
        </Button>
      </div>
    </div>
  )
}
