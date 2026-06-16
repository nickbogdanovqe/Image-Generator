// Apple Messages conversation date-separator formatting.
//
// Two formats, chosen by how old the conversation date is relative to "now":
//   • Within the last year →  "Mon, Jun 16 at 12:22"
//       (abbreviated weekday, comma, abbreviated month + day, "at", 24-hour time)
//   • Older than a year    →  "Jun 16, 2023, 12:22"
//       (abbreviated month + day, year, 24-hour time)

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const pad = (n) => String(n).padStart(2, '0')

// 24-hour clock, e.g. "00:30", "09:05", "14:22".
function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateLine(value, now = new Date()) {
  const d = value instanceof Date ? value : new Date(value)
  if (!d || Number.isNaN(d.getTime())) return ''

  const time = formatTime(d)

  // "Older than a year" boundary: same calendar date one year ago.
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  if (d < oneYearAgo) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${time}`
  }

  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} at ${time}`
}
