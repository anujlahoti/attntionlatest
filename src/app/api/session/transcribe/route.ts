import { createClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/openai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const audioFile = formData.get('audio') as File
  const sessionId = formData.get('sessionId') as string

  if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  try {
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const transcript = await transcribeAudio(buffer, audioFile.name || 'voice.webm')

    await supabase.from('weekly_sessions')
      .update({ transcript, status: 'transcribed' })
      .eq('id', sessionId)

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('Transcription failed', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
  }
}
