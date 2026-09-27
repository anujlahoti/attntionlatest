import { GOALS } from '@/types'

const PLANES = ['bg-rose', 'bg-ochre', 'bg-cobalt text-paper', 'bg-olive text-paper', 'bg-terracotta text-paper', 'bg-paper-deep']

export default function GoalPicker({
  selected,
  onToggle,
  max = 3,
}: {
  selected: string[]
  onToggle: (id: string) => void
  max?: number
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {GOALS.map((goal, i) => {
        const isSelected = selected.includes(goal.id)
        const isDisabled = !isSelected && selected.length >= max
        return (
          <button
            key={goal.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggle(goal.id)}
            aria-pressed={isSelected}
            className={`relative text-left border-2 border-ink p-4 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed ${
              i % 2 ? 'cut-alt' : 'cut'
            } ${
              isSelected
                ? `${PLANES[i % PLANES.length]} shadow-ink -translate-x-0.5 -translate-y-0.5`
                : 'bg-surface hover:shadow-ink-sm hover:-translate-x-0.5 hover:-translate-y-0.5'
            }`}
          >
            <span className="text-2xl">{goal.icon}</span>
            <p className="mt-2 font-semibold">{goal.label}</p>
            {isSelected && (
              <span className="absolute top-3 right-3 h-6 w-6 bg-ink text-paper text-xs font-bold flex items-center justify-center rounded-full">
                {selected.indexOf(goal.id) + 1}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
