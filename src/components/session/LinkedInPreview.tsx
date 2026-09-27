import { ReactNode } from 'react'

// The post as it will appear on LinkedIn, hung in an ink frame.
export default function LinkedInPreview({
  name,
  headline,
  text,
  imageUrl,
  footer,
  clamp = false,
}: {
  name: string
  headline?: string
  text: string
  imageUrl?: string | null
  footer?: ReactNode
  clamp?: boolean
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="bg-white border-2 border-ink cut overflow-hidden text-left">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="h-11 w-11 shrink-0 rounded-full border-2 border-ink bg-rose flex items-center justify-center text-ink text-sm font-bold">
          {initials || 'You'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{name}</p>
          <p className="text-xs text-muted truncate">{headline || 'Now'} · 🌐</p>
        </div>
        <svg className="ml-auto h-5 w-5 shrink-0 text-linkedin" viewBox="0 0 24 24" fill="currentColor" aria-label="LinkedIn">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
      </div>
      <p className={`px-5 pt-4 pb-4 text-[14.5px] leading-relaxed text-ink whitespace-pre-line ${clamp ? 'line-clamp-6' : ''}`}>
        {text}
      </p>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full max-h-[420px] object-cover border-t-2 border-ink" />
      )}
      <div className="flex items-center justify-between border-t-2 border-ink px-5 py-3 text-xs font-medium text-ink-soft">
        {footer ?? (
          <>
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>🔁 Repost</span>
            <span>➤ Send</span>
          </>
        )}
      </div>
    </div>
  )
}
