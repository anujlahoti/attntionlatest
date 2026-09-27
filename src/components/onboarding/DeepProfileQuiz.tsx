'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { DeepProfile, PROFILE_CARDS, ProfileCard, pruneConditional } from '@/lib/profile'

const PLANES = ['bg-rose', 'bg-ochre', 'bg-cobalt text-paper', 'bg-olive text-paper', 'bg-terracotta text-paper', 'bg-paper-deep']
const EXIT_MS = 200

// Seven quick taps, one card at a time. Card 3 depends on the answer to card 1.
export default function DeepProfileQuiz({
  initial = {},
  saving = false,
  error = '',
  finishLabel = "Let's build your presence 🚀",
  onComplete,
}: {
  initial?: DeepProfile
  saving?: boolean
  error?: string
  finishLabel?: string
  onComplete: (profile: DeepProfile) => void
}) {
  const [profile, setProfile] = useState<DeepProfile>(initial)
  const [index, setIndex] = useState(0)
  const [motion, setMotion] = useState<'in-right' | 'in-left' | 'out-left' | 'out-right'>('in-right')
  const [otherIndustry, setOtherIndustry] = useState(
    initial.industry && !PROFILE_CARDS[1].options?.some((o) => o.value === initial.industry) ? initial.industry : ''
  )
  const [showOther, setShowOther] = useState(!!otherIndustry)

  const cards = useMemo(() => PROFILE_CARDS.filter((c) => !c.showIf || c.showIf(profile)), [profile])
  const card = cards[Math.min(index, cards.length - 1)]
  const isLast = index >= cards.length - 1
  const value = profile[card.field]
  const answered = Array.isArray(value) ? value.length > 0 : !!value

  function go(delta: 1 | -1) {
    if (delta === 1 && isLast) {
      onComplete(pruneConditional(profile))
      return
    }
    setMotion(delta === 1 ? 'out-left' : 'out-right')
    setTimeout(() => {
      setIndex((i) => Math.max(0, Math.min(cards.length - 1, i + delta)))
      setMotion(delta === 1 ? 'in-right' : 'in-left')
    }, EXIT_MS)
  }

  function set(field: keyof DeepProfile, next: unknown) {
    setProfile((p) => pruneConditional({ ...p, [field]: next } as DeepProfile))
  }

  function pick(c: ProfileCard, optionValue: string) {
    if (c.kind === 'multi') {
      const current = (profile[c.field] as string[] | undefined) ?? []
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : current.length < (c.max ?? 2)
          ? [...current, optionValue]
          : current
      set(c.field, next)
      return
    }
    if (c.field === 'industry') setShowOther(false)
    set(c.field, optionValue)
  }

  const selectedCount = Array.isArray(value) ? value.length : 0

  return (
    <div>
      {/* Quiz progress: one tile per card */}
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        {!isLast && <span>{cards.length - index - 1} to go</span>}
      </div>
      <div className="mt-2 flex gap-1.5">
        {cards.map((c, i) => (
          <span
            key={c.field}
            className={`h-2 flex-1 border-[1.5px] border-ink transition-colors duration-300 ${
              i <= index ? PLANES[i % PLANES.length].split(' ')[0] : 'bg-surface'
            }`}
          />
        ))}
      </div>

      <div key={card.field} className={`mt-8 card-${motion}`}>
        <h2 className="font-display text-3xl sm:text-4xl leading-tight font-semibold tracking-tight">{card.question}</h2>
        {card.note && <p className="mt-2 text-ink-soft">{card.note}</p>}

        {card.kind === 'text' ? (
          <div className="mt-7">
            <Input
              autoFocus
              maxLength={100}
              placeholder={card.placeholder}
              value={(value as string) ?? ''}
              onChange={(e) => set(card.field, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && answered && go(1)}
            />
            <p className="mt-2 text-right text-xs text-muted">{((value as string) ?? '').length}/100</p>
          </div>
        ) : (
          <div className="mt-7 flex flex-wrap gap-3">
            {card.options!.map((option, i) => {
              const selected = Array.isArray(value) ? value.includes(option.value) : value === option.value
              const full = card.kind === 'multi' && !selected && selectedCount >= (card.max ?? 2)
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={full}
                  aria-pressed={selected}
                  onClick={() => pick(card, option.value)}
                  className={`relative inline-flex items-center gap-2 border-2 border-ink px-4 py-2.5 text-left text-[15px] font-medium transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed ${
                    i % 2 ? 'cut-alt' : 'cut-sm'
                  } ${
                    selected
                      ? `${PLANES[i % PLANES.length]} shadow-ink-sm -translate-x-0.5 -translate-y-0.5`
                      : 'bg-surface hover:bg-paper-deep'
                  }`}
                >
                  <span className="text-lg" aria-hidden>{option.icon}</span>
                  {option.label}
                  {selected && card.kind === 'multi' && <span className="ml-1 font-bold" aria-hidden>✓</span>}
                </button>
              )
            })}
            {card.allowOther && (
              <button
                type="button"
                onClick={() => {
                  setShowOther(true)
                  set(card.field, otherIndustry || undefined)
                }}
                className={`inline-flex items-center gap-2 border-2 border-dashed border-ink px-4 py-2.5 text-[15px] font-medium cut-sm ${
                  showOther ? 'bg-ink text-paper' : 'bg-surface hover:bg-paper-deep'
                }`}
              >
                ✏️ Other
              </button>
            )}
          </div>
        )}

        {card.allowOther && showOther && (
          <div className="mt-4 max-w-sm">
            <Input
              autoFocus
              maxLength={60}
              placeholder="Your industry"
              value={otherIndustry}
              onChange={(e) => {
                setOtherIndustry(e.target.value)
                set(card.field, e.target.value || undefined)
              }}
            />
          </div>
        )}
      </div>

      {error && <p className="mt-6 text-sm font-medium text-terracotta">{error}</p>}

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {index > 0 && (
          <Button variant="secondary" size="lg" onClick={() => go(-1)} disabled={saving}>
            ← Back
          </Button>
        )}
        <Button size="lg" variant={isLast ? 'accent' : 'primary'} onClick={() => go(1)} disabled={!answered && !isLast} loading={saving}>
          {isLast
            ? finishLabel
            : card.kind === 'multi'
              ? selectedCount
                ? `Next (${selectedCount}/${card.max ?? 2}) →`
                : `Select up to ${card.max ?? 2}`
              : 'Next →'}
        </Button>
        {!answered && !isLast && (
          <Button variant="ghost" size="lg" onClick={() => go(1)}>
            Skip
          </Button>
        )}
      </div>
    </div>
  )
}
