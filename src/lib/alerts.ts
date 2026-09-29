// Tells the team when quality silently degrades (e.g. the AI writer falls back
// to sketch drafts). Posts to ALERT_WEBHOOK_URL (Slack- or Discord-style
// incoming webhook) when set; always logs. Throttled so an outage sends one
// message per half hour, not one per request.

const THROTTLE_MS = 30 * 60 * 1000
const WINDOW = 20 // recent drafts considered
const THRESHOLD = 0.1 // alert when more than 10% fell back
const MIN_SAMPLES = 5

const lastSent = new Map<string, number>()
const outcomes: boolean[] = [] // true = AI draft, false = sketch fallback

export async function sendAlert(key: string, message: string) {
  console.error(`[ALERT] ${message}`)
  const url = process.env.ALERT_WEBHOOK_URL
  const now = Date.now()
  if (!url || now - (lastSent.get(key) ?? 0) < THROTTLE_MS) return
  lastSent.set(key, now)
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `text` for Slack, `content` for Discord.
      body: JSON.stringify({ text: `Attntion: ${message}`, content: `Attntion: ${message}` }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.error('Alert webhook failed', err)
  }
}

// Record whether a draft came from the AI writer; alerts past the fallback threshold.
// Per server instance: on serverless this sees a slice of traffic, which is
// enough to catch an outage (outages hit every instance at once).
export function recordDraftOutcome(fromAI: boolean, reason?: string) {
  outcomes.push(fromAI)
  if (outcomes.length > WINDOW) outcomes.shift()
  const fallbacks = outcomes.filter((ok) => !ok).length
  if (outcomes.length >= MIN_SAMPLES && fallbacks / outcomes.length > THRESHOLD) {
    void sendAlert(
      'draft-fallback',
      `${fallbacks} of the last ${outcomes.length} drafts fell back to sketch mode${reason ? ` (${reason})` : ''}. Check AI credits and keys.`
    )
  }
}
