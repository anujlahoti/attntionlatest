import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SafetyFlag } from '@/lib/safety'

const SEVERITY_TONE = { high: 'rose', medium: 'ochre', low: 'paper' } as const

// "Before you post": what could embarrass the author or break a confidence,
// with one-click anonymise and an explicit "I've checked" to post anyway.
export default function SafetyCard({
  flags,
  anonymizing,
  acknowledged,
  onAnonymize,
  onAcknowledge,
}: {
  flags: SafetyFlag[]
  anonymizing: boolean
  acknowledged: boolean
  onAnonymize: () => void
  onAcknowledge: (value: boolean) => void
}) {
  const serious = flags.filter((f) => f.severity !== 'low')
  return (
    <div className="canvas-card overflow-hidden fade-up">
      <div className="flex items-start gap-4 border-b-2 border-ink bg-terracotta text-paper p-5">
        <span className="h-10 w-10 shrink-0 rounded-full bg-paper text-ink border-2 border-ink flex items-center justify-center text-lg font-bold" aria-hidden>
          !
        </span>
        <div>
          <h3 className="font-display text-2xl font-semibold">Before you post</h3>
          <p className="mt-0.5 text-sm text-paper/85">
            {serious.length
              ? `I spotted ${serious.length === 1 ? 'something' : `${serious.length} things`} you might not want public.`
              : 'A small wording note before this goes live.'}
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <ul className="flex flex-col gap-3">
          {flags.map((f) => (
            <li key={`${f.kind}:${f.match}`} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={SEVERITY_TONE[f.severity]}>{f.label}</Badge>
              <span className="font-mono text-[13px] bg-paper-deep border border-ink/20 px-1.5 py-0.5">&ldquo;{f.match.trim()}&rdquo;</span>
              {f.replacement && <span className="text-muted">→ {f.replacement}</span>}
              {f.append && <span className="text-muted">→ adds a one-line disclaimer</span>}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t-2 border-dashed border-ink/25 pt-5">
          <Button variant="accent" loading={anonymizing} onClick={onAnonymize}>
            Anonymise for me
          </Button>
          <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-ink"
              checked={acknowledged}
              onChange={(e) => onAcknowledge(e.target.checked)}
            />
            I&apos;ve checked, keep it as written
          </label>
        </div>
      </div>
    </div>
  )
}
