import { toFile } from 'openai'
import { openai } from './ai'

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const transcription = await openai().audio.transcriptions.create({
    file: await toFile(audioBuffer, filename),
    model: 'whisper-1',
    language: 'en',
  })

  return transcription.text
}
