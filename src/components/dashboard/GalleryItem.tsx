'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import AnalyticsCard from './AnalyticsCard'
import { PostAnalytics, WeeklySession } from '@/types'

const FRAMES = ['bg-rose', 'bg-ochre', 'bg-cobalt', 'bg-olive', 'bg-paper-deep']

export default function GalleryItem({
  session,
  analytics,
  index,
}: {
  session: WeeklySession
  analytics?: PostAnalytics
  index: number
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = session.final_post || session.draft_post || ''
  const published = session.status === 'published'
  const date = new Date(session.week_of).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })

  async function copy() {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <article className={`${FRAMES[index % FRAMES.length]} border-2 border-ink p-3 shadow-ink-sm ${index % 2 ? 'cut-alt' : 'cut'} break-inside-avoid mb-6`}>
      <div className="bg-surface border-2 border-ink p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display italic text-lg">No. {index + 1}</span>
          <Badge tone={published ? 'olive' : 'paper'}>{published ? 'Posted' : session.status === 'drafted' ? 'Draft' : 'Unfinished'}</Badge>
        </div>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Week of {date}</p>

        <p className="mt-4 text-sm font-semibold text-ink-soft">&ldquo;{session.question}&rdquo;</p>

        {text ? (
          <>
            <p className={`mt-4 text-sm leading-relaxed whitespace-pre-line ${open ? '' : 'line-clamp-6'}`}>{text}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
                {open ? 'Show less' : 'Read all'}
              </Button>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? '✓ Copied' : 'Copy text'}
              </Button>
              {session.linkedin_post_id && (
                <a
                  href={`https://www.linkedin.com/feed/update/${session.linkedin_post_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-cobalt underline decoration-2 underline-offset-4"
                >
                  On LinkedIn →
                </a>
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">No post was painted this week.</p>
        )}
        <AnalyticsCard analytics={analytics} />
      </div>
    </article>
  )
}
