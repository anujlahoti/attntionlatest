import { HTMLAttributes } from 'react'

type Tone = 'paper' | 'ochre' | 'cobalt' | 'rose' | 'olive' | 'ink'

const tones: Record<Tone, string> = {
  paper: 'bg-surface text-ink',
  ochre: 'bg-ochre text-ink',
  cobalt: 'bg-cobalt text-white',
  rose: 'bg-rose text-ink',
  olive: 'bg-olive text-white',
  ink: 'bg-ink text-paper',
}

export default function Badge({
  tone = 'paper',
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-[1.5px] border-ink px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] cut-sm ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
