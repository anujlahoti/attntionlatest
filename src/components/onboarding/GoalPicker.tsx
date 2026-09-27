import { GOALS } from '@/types'

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
    <div className="grid grid-cols-2 gap-3">
      {GOALS.map((goal) => {
        const isSelected = selected.includes(goal.id)
        const isDisabled = !isSelected && selected.length >= max
        return (
          <button
            key={goal.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggle(goal.id)}
            className={`text-left rounded-xl border p-4 transition disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected
                ? 'border-[#00E8D0] bg-zinc-900'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
            }`}
          >
            <span className="text-2xl">{goal.icon}</span>
            <p className="mt-2 text-sm font-medium text-white">{goal.label}</p>
          </button>
        )
      })}
    </div>
  )
}
