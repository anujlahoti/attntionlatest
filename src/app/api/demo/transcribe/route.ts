import { transcribeAudio } from '@/lib/openai'
import { demoRateLimit } from '@/lib/demo-guard'
import { NextResponse } from 'next/server'

const MAX_AUDIO_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const limited = await demoRateLimit(request)
  if (limited) return limited

  const formData = await request.formData()
  const audioFile = formData.get('audio') as File | null
  if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 })
  if (audioFile.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Voice note is too long for the demo' }, { status: 413 })
  }

  try {
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const transcript = await transcribeAudio(buffer, audioFile.name || 'voice.webm')
    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('Demo transcription failed', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
  }
}
