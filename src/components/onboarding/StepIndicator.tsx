export default function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition ${
            i < step
              ? 'bg-gradient-to-r from-[#00E8D0] to-[#C8FF00]'
              : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  )
}
