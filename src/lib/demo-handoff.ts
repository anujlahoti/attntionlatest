// Carries a demo visitor's profile and draft into their new account, so "Save my
// progress with an account" really saves it. Browser-only; every access is
// guarded because storage can be unavailable (private mode, blocked cookies).

const KEY = 'attntion:demo-handoff'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface DemoHandoff {
  savedAt: number
  profile: {
    name?: string
    company?: string
    profile_type?: string
    industry?: string
    goals?: string[]
    website?: string
  }
  question?: string
  transcript?: string
  draft?: string
}

export function saveHandoff(data: Omit<DemoHandoff, 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }))
  } catch {
    // Storage unavailable: the account simply starts fresh.
  }
}

export function readHandoff(): DemoHandoff | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as DemoHandoff
    if (!data.savedAt || Date.now() - data.savedAt > MAX_AGE_MS) return null
    return data
  } catch {
    return null
  }
}

export function clearHandoffDraft() {
  try {
    const data = readHandoff()
    if (data) localStorage.setItem(KEY, JSON.stringify({ ...data, question: undefined, transcript: undefined, draft: undefined }))
  } catch {
    // ignore
  }
}

export function clearHandoff() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
