'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

export interface PublishResult {
  success: boolean
  manual?: boolean
  message?: string
  postId?: string
}

export default function PublishButton({
  sessionId,
  finalPost,
  photoPath,
  onResult,
}: {
  sessionId: string
  finalPost: string
  photoPath?: string | null
  onResult: (result: PublishResult) => void
}) {
  const [loading, setLoading] = useState(false)

  async function handlePublish() {
    setLoading(true)
    try {
      const res = await fetch('/api/session/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, finalPost, photoPath }),
      })
      const result = await res.json()
      onResult(result)
    } catch {
      onResult({ success: false, message: 'Something went wrong publishing. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="lg" loading={loading} onClick={handlePublish} className="w-full">
      Post to LinkedIn →
    </Button>
  )
}
