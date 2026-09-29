// Monday reminders. Email goes through Resend when RESEND_API_KEY and EMAIL_FROM
// are set; otherwise sending is skipped (the cron reports how many were sent).

export function emailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, text }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export interface Recap {
  impressions: number
  reactions: number
  comments: number
}

// This week's question with a one-tap link (tracked via /api/r), plus last
// week's logged results when there are any.
export async function sendWeeklyReminder(to: { id: string; email: string; name?: string }, question: string, recap?: Recap | null) {
  const first = to.name?.split(' ')[0] || 'there'
  const link = `${appUrl()}/api/r?e=email_click&u=${encodeURIComponent(to.id)}&to=/session`
  const recapLine = recap
    ? `Last week's post: ${recap.impressions.toLocaleString()} impressions, ${recap.reactions} reactions, ${recap.comments} comments.`
    : ''

  const html = `<div style="font-family:Georgia,serif;background:#f3ede2;padding:32px;color:#17150f">
  <p style="font:600 12px/1 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6f675a">Your muse asks</p>
  <p style="font-size:24px;line-height:1.3;margin:12px 0 24px">${escapeHtml(question)}</p>
  <a href="${link}" style="display:inline-block;background:#17150f;color:#f3ede2;padding:14px 22px;border-radius:4px 14px 4px 14px;font:600 15px Arial,sans-serif;text-decoration:none">Answer in 2 minutes →</a>
  ${recapLine ? `<p style="font:14px Arial,sans-serif;color:#3d382e;margin-top:28px">${escapeHtml(recapLine)}</p>` : ''}
  <p style="font:12px Arial,sans-serif;color:#6f675a;margin-top:28px">Seven minutes. One post. Every week. — attntion</p>
</div>`
  const text = `Hi ${first},\n\nYour muse asks: ${question}\n\nAnswer in 2 minutes: ${link}\n${recapLine ? `\n${recapLine}\n` : ''}`

  await sendEmail(to.email, `${first}, this week's question is ready`, html, text)
}

// A recurring Monday 09:00 (local time) calendar invite linking to this week's session.
export function weeklyIcs(): string {
  const now = new Date()
  const next = new Date(now)
  next.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7))
  const ymd = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//attntion//weekly//EN',
    'BEGIN:VEVENT',
    `UID:attntion-weekly-${ymd}@attntion`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${ymd}T090000`,
    `DTEND:${ymd}T091500`,
    'RRULE:FREQ=WEEKLY;BYDAY=MO',
    "SUMMARY:Answer this week's attntion question (7 min)",
    `DESCRIPTION:Your muse has a new question. Answer here: ${appUrl()}/session`,
    `URL:${appUrl()}/session`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
