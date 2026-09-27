import { IntegrationStatus } from '@/lib/integrations'

const DABS = ['bg-cobalt', 'bg-terracotta', 'bg-ochre', 'bg-olive', 'bg-rose', 'bg-ink']

// The muse's palette: a filled dab means the tool is live, an empty one means
// a fallback is standing in.
export default function IntegrationPanel({ integrations }: { integrations: IntegrationStatus[] }) {
  const liveCount = integrations.filter((i) => i.live).length
  return (
    <div className="canvas-card p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold">The palette</h3>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          {liveCount}/{integrations.length} live
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-3.5">
        {integrations.map((item, i) => (
          <li key={item.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 h-5 w-5 shrink-0 border-2 border-ink ${i % 2 ? 'rounded-full' : 'cut-sm'} ${
                item.live ? DABS[i % DABS.length] : 'bg-surface border-dashed'
              }`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {item.label}{' '}
                <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${item.live ? 'text-olive' : 'text-terracotta'}`}>
                  {item.live ? 'Live' : 'Fallback'}
                </span>
              </p>
              <p className="text-xs text-muted leading-snug">{item.live ? item.purpose : item.fallback}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
