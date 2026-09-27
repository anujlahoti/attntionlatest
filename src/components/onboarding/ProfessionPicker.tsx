import { NICHE_MAP } from '@/types'

export default function ProfessionPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (profession: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Profession">
      {Object.keys(NICHE_MAP).map((key) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`h-10 px-4 text-sm font-medium border-2 border-ink cut-sm transition-all duration-150 ${
              active
                ? 'bg-ink text-paper shadow-[3px_3px_0_0_#e9b23c] -translate-x-0.5 -translate-y-0.5'
                : 'bg-surface text-ink hover:bg-paper-deep'
            }`}
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}
