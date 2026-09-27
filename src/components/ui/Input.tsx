import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-zinc-900 border border-zinc-800 focus:border-[#00E8D0] focus:outline-none rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 transition ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export default Input
