'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PhotoUpload({
  userId,
  sessionId,
  onUploaded,
}: {
  userId: string
  sessionId: string
  onUploaded: (path: string, previewUrl: string) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError('')
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${sessionId}/photo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('session-files')
      .upload(path, file, { upsert: true })

    setUploading(false)

    if (uploadError) {
      setError('Could not upload photo. Try again.')
      return
    }

    onUploaded(path, previewUrl)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="cursor-pointer rounded-xl border-2 border-dashed border-zinc-700 hover:border-[#00E8D0] transition aspect-square flex items-center justify-center overflow-hidden bg-zinc-900"
      >
        {preview ? (
          <img src={preview} alt="Selected photo" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-6">
            <p className="text-3xl">📷</p>
            <p className="mt-2 text-sm text-zinc-400">Tap to take or upload a photo</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onInputChange}
        className="hidden"
      />

      {uploading && <p className="mt-2 text-sm text-zinc-400">Uploading...</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
