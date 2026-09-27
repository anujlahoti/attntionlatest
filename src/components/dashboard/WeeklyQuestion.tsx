import Link from 'next/link'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { WeeklySession } from '@/types'

export default function WeeklyQuestion({
  session,
  winningFormat,
}: {
  session: WeeklySession | null
  winningFormat?: string
}) {
  if (!session) {
    return (
      <Card className="border-l-[3px] border-l-[#00E8D0]">
        <p className="text-zinc-400">Your first question is on its way.</p>
      </Card>
    )
  }

  const isPublished = session.status === 'published'

  return (
    <Card className="border-l-[3px] border-l-[#00E8D0]">
      {isPublished ? (
        <>
          <p className="text-sm font-medium text-green-400">Posted this week ✓</p>
          <p className="mt-3 text-white whitespace-pre-line">{session.final_post}</p>
        </>
      ) : (
        <>
          {winningFormat && (
            <Badge className="mb-3">{winningFormat} is winning this week</Badge>
          )}
          <p className="text-xl font-medium text-white">{session.question}</p>
          <Link href="/session" className="inline-block mt-5">
            <Button size="lg">Start recording →</Button>
          </Link>
        </>
      )}
    </Card>
  )
}
