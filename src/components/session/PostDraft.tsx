const LINKEDIN_LIMIT = 3000

export default function PostDraft({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const remaining = LINKEDIN_LIMIT - value.length

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00E8D0] focus:outline-none rounded-lg px-4 py-3 text-white resize-none"
      />
      <p className={`mt-2 text-right text-xs ${remaining < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
        {value.length} / {LINKEDIN_LIMIT}
      </p>
    </div>
  )
}
