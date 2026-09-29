'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import { PROFILE_CARDS } from '@/lib/profile'

const ROLE_CARD = PROFILE_CARDS.find((c) => c.field === 'profile_type')!
const INDUSTRY_CARD = PROFILE_CARDS.find((c) => c.field === 'industry')!

function Chips({
  options,
  value,
  onPick,
  label,
}: {
  options: { value: string; label: string; icon: string }[]
  value?: string
  onPick: (value: string) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(o.value)}
            className={`inline-flex items-center gap-2 h-10 px-3.5 text-sm font-medium border-2 border-ink cut-sm transition-all duration-150 ${
              active ? 'bg-ink text-paper shadow-[3px_3px_0_0_#e9b23c] -translate-x-0.5 -translate-y-0.5' : 'bg-surface hover:bg-paper-deep'
            }`}
          >
            <span aria-hidden>{o.icon}</span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// Role and industry: the two answers that decide the niche, hashtags and questions.
// Replaces the old profession picker (which duplicated quiz card 1).
export default function RoleIndustryPicker({
  role,
  industry,
  onRole,
  onIndustry,
}: {
  role?: string
  industry?: string
  onRole: (role: string) => void
  onIndustry: (industry: string) => void
}) {
  const known = INDUSTRY_CARD.options!.some((o) => o.value === industry)
  const [other, setOther] = useState(!!industry && !known)

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold">Which fits you best?</span>
        <Chips options={ROLE_CARD.options!} value={role} onPick={onRole} label="Role" />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold">Your industry</span>
        <Chips
          options={[...INDUSTRY_CARD.options!, { value: '__other', label: 'Other', icon: '✏️' }]}
          value={other ? '__other' : industry}
          onPick={(v) => {
            if (v === '__other') {
              setOther(true)
              onIndustry('')
            } else {
              setOther(false)
              onIndustry(v)
            }
          }}
          label="Industry"
        />
        {other && (
          <div className="max-w-sm">
            <Input
              autoFocus
              maxLength={60}
              placeholder="e.g. Legal Tech, Hospitality, Logistics"
              value={industry ?? ''}
              onChange={(e) => onIndustry(e.target.value)}
              aria-label="Your industry"
            />
          </div>
        )}
      </div>
    </div>
  )
}
