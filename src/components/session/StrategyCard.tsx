'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import type { StrategyBrief } from '@/lib/strategist'

// "How your muse shaped this": the strategist's decisions behind the draft
// (angle, framework, why it works) and alternative hooks to swap in.
export default function StrategyCard({
  strategy,
  currentHook,
  onUseHook,
}: {
  strategy: StrategyBrief
  currentHook: string
  onUseHook: (hook: string) => void
}) {
  const [open, setOpen] = useState(true)
  const norm = (s: string) => s.replace(/[….]+$/, '').trim().toLowerCase()

  return (
    <div className="bg-surface border-2 border-ink cut-alt overflow-hidden fade-up">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 bg-olive text-paper px-5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-lg font-semibold">How your muse shaped this</span>
        <span className="text-xs font-bold uppercase tracking-[0.14em]">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="p-5 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">The angle</p>
              <p className="mt-1 text-sm font-medium leading-snug">{strategy.angle}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Why it works for your audience</p>
              <p className="mt-1 text-sm leading-snug">{strategy.audience_takeaway}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Story structure</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="ochre">{strategy.framework}</Badge>
              {strategy.framework_steps.map((step, i) => (
                <span key={i} className="text-xs text-ink-soft">
                  {i > 0 && <span className="mr-2 text-faint">→</span>}
                  {step}
                </span>
              ))}
            </div>
          </div>

          {strategy.hook_options.length > 1 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Try a different hook</p>
              <ul className="mt-2 grid gap-2">
                {strategy.hook_options.map((h) => {
                  const active = norm(h.text) === norm(currentHook)
                  return (
                    <li key={h.text}>
                      <button
                        type="button"
                        onClick={() => onUseHook(h.text)}
                        disabled={active}
                        className={`w-full text-left border-2 px-3 py-2 text-sm cut-sm transition ${
                          active ? 'border-ink bg-ochre/30 cursor-default' : 'border-ink/30 bg-paper hover:border-ink hover:bg-paper-deep'
                        }`}
                      >
                        <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{h.type}</span>
                        {h.text}
                        {active && <span className="ml-2 text-xs font-semibold text-olive">✓ in use</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
