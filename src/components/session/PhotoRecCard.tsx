import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Typing } from './Bubbles'
import { PhotoRecommendation } from '@/types'

const SHOT_PLANES = ['bg-rose', 'bg-ochre', 'bg-paper-deep']

// "What photo should you take?": shown once the draft is ready, before upload.
export default function PhotoRecCard({
  rec,
  loading,
  uploading,
  onUpload,
}: {
  rec: (PhotoRecommendation & { preview?: boolean }) | null
  loading: boolean
  uploading: boolean
  onUpload: () => void
}) {
  return (
    <div className="canvas-card overflow-hidden fade-up">
      <div className="flex items-start gap-4 border-b-2 border-ink bg-cobalt text-paper p-5 sm:p-6">
        <span className="h-12 w-12 shrink-0 rounded-full bg-ochre border-2 border-ink flex items-center justify-center text-2xl" aria-hidden>
          📸
        </span>
        <div>
          <h3 className="font-display text-2xl font-semibold">What photo should you take?</h3>
          <p className="mt-1 text-sm text-paper/80">Real photos of you get far more engagement than stock images. Here&apos;s what suits this post.</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading || !rec ? (
          <div className="flex items-center gap-3 text-ink-soft">
            <Typing /> Studying your post for the right shot…
          </div>
        ) : (
          <>
            <div className="border-l-4 border-terracotta pl-4">
              <p className="font-display text-xl font-semibold leading-snug">{rec.recommendation}</p>
              <p className="mt-1.5 text-sm text-ink-soft">
                <span className="font-semibold">Why:</span> {rec.why}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {rec.shot_options.slice(0, 3).map((shot, i) => (
                <div key={shot.type + i} className={`${SHOT_PLANES[i % SHOT_PLANES.length]} border-2 border-ink p-4 ${i % 2 ? 'cut-alt' : 'cut-sm'}`}>
                  <Badge tone="paper">{shot.type}</Badge>
                  <p className="mt-3 text-sm leading-relaxed">{shot.description}</p>
                  <p className="mt-3 text-xs font-medium text-ink-soft">💡 {shot.tip}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t-2 border-dashed border-ink/25 pt-5">
          <p className="text-sm font-semibold">Ready? Snap it and upload:</p>
          <Button variant="accent" loading={uploading} onClick={onUpload}>
            📷 Upload my photo
          </Button>
        </div>
      </div>
    </div>
  )
}
