import Link from 'next/link'
import MuseFace from '@/components/ui/MuseFace'
import { buttonClasses } from '@/components/ui/Button'
import { Plane } from '@/components/ui/Art'

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      <Plane shape="quarter" color="#2346b5" size={260} className="absolute -left-16 -top-16" />
      <Plane shape="circle" color="#e9b23c" size={140} className="absolute right-10 bottom-10" />
      <div className="relative text-center">
        <MuseFace size={140} state="thinking" className="mx-auto" />
        <p className="mt-6 font-display text-8xl font-semibold italic">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">This canvas is blank.</h1>
        <p className="mt-2 text-ink-soft">The page you were looking for isn&apos;t hanging here.</p>
        <Link href="/" className={buttonClasses('primary', 'lg', 'mt-8')}>Back to the entrance</Link>
      </div>
    </main>
  )
}
