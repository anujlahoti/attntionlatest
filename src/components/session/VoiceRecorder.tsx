'use client'

import { useRef, useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

type RecorderState = 'idle' | 'recording' | 'stopped' | 'uploading' | 'done'

export default function VoiceRecorder({
  sessionId,
  onTranscribed,
}: {
  sessionId: string
  onTranscribed: (transcript: string) => void
}) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setElapsed(0)
      setState('recording')

      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } catch {
      setError('We need microphone access to record your voice note.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setState('stopped')
  }

  function reRecord() {
    setAudioUrl(null)
    setState('idle')
  }

  async function useThisRecording() {
    setState('uploading')
    setError('')

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', blob, 'voice.webm')
    formData.append('sessionId', sessionId)

    try {
      const res = await fetch('/api/session/transcribe', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Transcription failed')
      const { transcript } = await res.json()
      setState('done')
      onTranscribed(transcript)
    } catch {
      setError('Something went wrong transcribing your voice note. Try again.')
      setState('stopped')
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {state === 'idle' && (
        <button
          onClick={startRecording}
          className="h-28 w-28 rounded-full bg-gradient-to-r from-[#00E8D0] to-[#C8FF00] flex items-center justify-center text-black text-4xl"
          aria-label="Start recording"
        >
          🎙
        </button>
      )}
      {state === 'idle' && <p className="text-zinc-400 text-sm">Tap to record</p>}

      {state === 'recording' && (
        <>
          <div className="h-28 w-28 rounded-full bg-red-500/20 border-2 border-red-500 animate-pulse flex items-center justify-center text-3xl">
            🔴
          </div>
          <p className="text-white font-medium">Recording... {formatTime(elapsed)}</p>
          <Button variant="secondary" onClick={stopRecording}>Stop</Button>
        </>
      )}

      {state === 'stopped' && audioUrl && (
        <>
          <audio src={audioUrl} controls className="w-full" />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={reRecord}>Re-record</Button>
            <Button onClick={useThisRecording}>Use this</Button>
          </div>
        </>
      )}

      {state === 'uploading' && (
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Transcribing...
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  )
}
