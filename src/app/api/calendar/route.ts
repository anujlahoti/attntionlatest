import { weeklyIcs } from '@/lib/notify'

// "Add to calendar": a recurring Monday 09:00 reminder to answer the weekly question.
export function GET() {
  return new Response(weeklyIcs(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="attntion-weekly.ics"',
    },
  })
}
