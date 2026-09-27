// Stepped progress: one ink-outlined tile per step, filled in painter's colours.
const FILLS = ['bg-ochre', 'bg-rose', 'bg-cobalt', 'bg-olive']

export default function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-3 flex-1 border-2 border-ink transition-colors duration-500 ${i % 2 ? 'cut-alt' : 'cut'} ${
            i < step ? FILLS[i % FILLS.length] : 'bg-surface'
          }`}
        />
      ))}
    </div>
  )
}
