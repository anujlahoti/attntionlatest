import { HTMLAttributes } from 'react'

export default function Badge({ className = '', children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs text-zinc-300 ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
