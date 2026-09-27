export default function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#00E8D0] to-[#C8FF00] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
