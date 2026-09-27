import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'linkedin'
type Size = 'sm' | 'md' | 'lg'

// Cut-paper buttons: ink outline, hard offset shadow that collapses when pressed.
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-ink text-paper border-2 border-ink shadow-cobalt hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_#2346b5] active:translate-x-1 active:translate-y-1 active:shadow-none',
  secondary:
    'bg-surface text-ink border-2 border-ink shadow-ink-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#17150f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  accent:
    'bg-ochre text-ink border-2 border-ink shadow-ink hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#17150f] active:translate-x-1 active:translate-y-1 active:shadow-none',
  linkedin:
    'bg-cobalt text-white border-2 border-ink shadow-ink-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#17150f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  ghost: 'text-ink-soft hover:text-ink underline-offset-4 decoration-terracotta decoration-2 hover:underline',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-base',
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ochre/60'

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className = '') {
  const shape = variant === 'ghost' ? '' : 'cut-sm'
  return `${base} ${shape} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}
