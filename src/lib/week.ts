// Sessions are weekly, keyed by the Monday of the current week (UTC), so
// opening the app on different days of the same week lands on the same session.
export function currentWeekOf(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().split('T')[0]
}
