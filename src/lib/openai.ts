import { toFile } from 'openai'
import { openai } from './ai'

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const transcription = await openai().audio.transcriptions.create({
    file: await toFile(audioBuffer, filename),
    // No language hint: Whisper auto-detects, so Hindi, Hinglish and other
    // answers transcribe as spoken; the writer turns them into English posts.
    model: 'whisper-1',
  })

  return transcription.text
}
