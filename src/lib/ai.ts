import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Claude is the preferred writer; OpenAI is the fallback so the product still
// works end-to-end when only an OpenAI key is available.
export type AIProvider = 'claude' | 'openai'

const CLAUDE_MODEL = 'claude-opus-4-5'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export function hasAnthropicKey() {
  return !!process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')
}

export function hasOpenAIKey() {
  return !!process.env.OPENAI_API_KEY?.startsWith('sk-')
}

export function aiProvider(): AIProvider | null {
  if (hasAnthropicKey()) return 'claude'
  if (hasOpenAIKey()) return 'openai'
  return null
}

let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function anthropic() {
  anthropicClient ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropicClient
}

export function openai() {
  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openaiClient
}

// Last failure from the AI provider (e.g. out of credits), surfaced on the status panel.
let lastAIError: { message: string; at: number } | null = null

export function recentAIError() {
  return lastAIError && Date.now() - lastAIError.at < 15 * 60 * 1000 ? lastAIError.message : null
}

export async function generateText(prompt: string): Promise<string> {
  try {
    const text = await callProvider(prompt)
    lastAIError = null
    return text
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    lastAIError = {
      message: /credit|quota|billing/i.test(message) ? 'Out of credits' : /401|auth|api key/i.test(message) ? 'Key rejected' : 'Unavailable',
      at: Date.now(),
    }
    throw err
  }
}

async function callProvider(prompt: string): Promise<string> {
  const provider = aiProvider()
  if (!provider) {
    throw new Error('No AI key configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local.')
  }

  if (provider === 'claude') {
    const response = await anthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })
    return response.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('')
      .trim()
  }

  const response = await openai().chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0]?.message?.content?.trim() ?? ''
}

// Models sometimes wrap JSON in ```json fences or add a sentence around it.
export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await generateText(prompt)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI did not return JSON')
  return JSON.parse(text.slice(start, end + 1)) as T
}
