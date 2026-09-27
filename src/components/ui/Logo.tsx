import Link from 'next/link'
import MuseFace from './MuseFace'

export default function Logo({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 group" aria-label="Attntion home">
      <MuseFace size={34} className="transition-transform group-hover:-rotate-6" />
      <span className={`font-display text-[22px] font-semibold italic tracking-tight ${light ? 'text-paper' : 'text-ink'}`}>
        attntion
      </span>
    </Link>
  )
}
