import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

export const fieldClasses =
  'w-full bg-surface border-2 border-ink cut-sm px-4 text-ink placeholder:text-faint transition focus:outline-none focus:shadow-ochre focus:-translate-x-0.5 focus:-translate-y-0.5 disabled:opacity-60'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${fieldClasses} h-13 ${className}`} {...props} />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${fieldClasses} py-3.5 leading-relaxed resize-none ${className}`} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">
        {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export default Input
