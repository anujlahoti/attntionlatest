import OpenAI, { toFile } from 'openai'

export const openai = new OpenAI({
  // Falls back to a placeholder so the client can construct at build/import time
  // even before .env.local is filled in — real requests still need a real key.
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-openai-key',
})

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: await toFile(audioBuffer, filename),
    model: 'whisper-1',
    language: 'en',
  })

  return transcription.text
}
