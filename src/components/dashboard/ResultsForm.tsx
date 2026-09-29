'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

const FIELDS = [
  { key: 'impressions', label: 'Impressions' },
  { key: 'reactions', label: 'Reactions' },
  { key: 'comments', label: 'Comments' },
] as const

// Log how a post did (the numbers LinkedIn shows under it) when Blotato isn't
// pulling analytics automatically. Feeds the Studio stats and the weekly recap.
export default function ResultsForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState({ impressions: '', reactions: '', comments: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/session/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...values }),
    })
    setSaving(false)
    if (!res.ok) {
      setError('Could not save. Try again.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
        📈 Log results
      </Button>
    )
  }

  return (
    <div className="mt-4 border-t-2 border-dashed border-ink/25 pt-4">
      <p className="text-xs text-ink-soft">From the numbers under your post on LinkedIn.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{f.label}</span>
            <input
              inputMode="numeric"
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value.replace(/[^\d]/g, '') })}
              className="h-10 w-full px-2 bg-surface border-2 border-ink cut-sm text-sm tabular-nums"
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-terracotta">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" loading={saving} disabled={!values.impressions && !values.reactions && !values.comments} onClick={save}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
