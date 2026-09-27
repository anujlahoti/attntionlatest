'use client'

import { useRef, useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import MuseFace from '@/components/ui/MuseFace'

type RecorderState = 'idle' | 'recording' | 'stopped' | 'uploading'

const MAX_SECONDS = 180

// Minimal typing for the Web Speech API (Chrome/Edge/Safari), which TS does not ship.
interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function createSpeechRecognition(): BrowserSpeechRecognition | null {
  const w = window as unknown as Record<string, (new () => BrowserSpeechRecognition) | undefined>
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VoiceRecorder({
  transcribe,
  onTranscribed,
  onTypeInstead,
}: {
  transcribe: (audio: Blob, filename: string) => Promise<string>
  onTranscribed: (transcript: string) => void
  onTypeInstead: () => void
}) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeRef = useRef('audio/webm')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Live browser transcript, used if the server-side transcription (Whisper) is unavailable.
  const speechRef = useRef<BrowserSpeechRecognition | null>(null)
  const speechTextRef = useRef('')
  const listeningRef = useRef(false)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoStopRef.current) clearTimeout(autoStopRef.current)
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop())
      listeningRef.current = false
      speechRef.current?.stop()
    }
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      // Safari records audio/mp4, Chrome/Firefox audio/webm — keep whatever we got.
      mimeRef.current = recorder.mimeType || 'audio/webm'
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setElapsed(0)
      setState('recording')

      startSpeechRecognition()
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
      autoStopRef.current = setTimeout(stopRecording, MAX_SECONDS * 1000)
    } catch {
      setError('I need microphone access to hear you. You can also type your answer.')
    }
  }

  function startSpeechRecognition() {
    speechTextRef.current = ''
    const recognition = createSpeechRecognition()
    if (!recognition) return
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) speechTextRef.current += `${e.results[i][0].transcript.trim()}. `
      }
    }
    // Chrome ends recognition after a pause; keep it going while we are still recording.
    recognition.onend = () => {
      if (listeningRef.current) {
        try { recognition.start() } catch {}
      }
    }
    listeningRef.current = true
    try {
      recognition.start()
      speechRef.current = recognition
    } catch {
      listeningRef.current = false
    }
  }

  function stopRecording() {
    listeningRef.current = false
    speechRef.current?.stop()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoStopRef.current) clearTimeout(autoStopRef.current)
    setState('stopped')
  }

  function reRecord() {
    setAudioUrl(null)
    setState('idle')
  }

  async function useThisRecording() {
    setState('uploading')
    setError('')
    const blob = new Blob(chunksRef.current, { type: mimeRef.current })
    const ext = mimeRef.current.includes('mp4') ? 'mp4' : mimeRef.current.includes('ogg') ? 'ogg' : 'webm'

    try {
      const transcript = await transcribe(blob, `voice.${ext}`)
      onTranscribed(transcript)
    } catch {
      const browserTranscript = speechTextRef.current.trim()
      if (browserTranscript) {
        onTranscribed(browserTranscript)
        return
      }
      setError('I could not transcribe that one. Try again, or type your answer instead.')
      setState('stopped')
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {state === 'idle' && (
        <>
          <button
            onClick={startRecording}
            className="group relative h-32 w-32 rounded-full bg-terracotta border-[3px] border-ink shadow-ink transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_#17150f] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ochre/60"
            aria-label="Start recording"
          >
            <span className="absolute -top-3 -right-4 h-10 w-10 bg-ochre border-2 border-ink rotate-12 cut-sm" aria-hidden />
            <svg className="relative mx-auto h-12 w-12 text-paper transition group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          </button>
          <p className="text-sm text-muted">Tap to record · up to 3 minutes</p>
        </>
      )}

      {state === 'recording' && (
        <>
          <MuseFace size={120} state="listening" />
          <p className="font-display text-4xl font-semibold tabular-nums">{formatTime(elapsed)}</p>
          <p className="text-sm text-muted -mt-3">I&apos;m listening. Talk like you would to a friend.</p>
          <Button onClick={stopRecording}>
            <span className="h-2.5 w-2.5 bg-terracotta" /> Done
          </Button>
        </>
      )}

      {state === 'stopped' && audioUrl && (
        <div className="w-full flex flex-col items-center gap-4">
          <audio src={audioUrl} controls className="w-full max-w-md" />
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={reRecord}>Re-record</Button>
            <Button onClick={useThisRecording}>Use this recording</Button>
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <>
          <MuseFace size={96} state="thinking" />
          <p className="text-sm text-muted">Listening back to your note…</p>
        </>
      )}

      {error && <p className="text-sm font-medium text-terracotta text-center">{error}</p>}

      {(state === 'idle' || state === 'stopped') && (
        <button onClick={onTypeInstead} className="text-sm font-semibold text-cobalt underline decoration-2 underline-offset-4 decoration-ochre hover:decoration-cobalt">
          Prefer to type? Write your answer instead
        </button>
      )}
    </div>
  )
}
