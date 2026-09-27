'use client'

import MuseFace from '@/components/ui/MuseFace'
import Button from '@/components/ui/Button'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="canvas-card p-10 text-center max-w-md">
        <MuseFace size={110} className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-semibold">The paint didn&apos;t take.</h1>
        <p className="mt-2 text-ink-soft">Something went wrong on our side. Give it another stroke.</p>
        <Button size="lg" className="mt-8" onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
