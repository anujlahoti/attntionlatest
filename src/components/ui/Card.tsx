import { HTMLAttributes } from 'react'

export default function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
