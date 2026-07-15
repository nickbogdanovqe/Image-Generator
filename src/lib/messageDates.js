/** Gap at or above this inserts another date/time header (same-day or next day). */
export const DATE_SEPARATOR_GAP_MS = 2 * 60 * 60 * 1000

export function isSameCalendarDay(a, b) {
  const d1 = a instanceof Date ? a : new Date(a)
  const d2 = b instanceof Date ? b : new Date(b)
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function getEffectiveDateTime(messages, index, defaultDateTime) {
  for (let i = index; i >= 0; i--) {
    if (messages[i].dateTime) {
      const d = messages[i].dateTime
      return d instanceof Date ? d : new Date(d)
    }
  }
  return defaultDateTime instanceof Date ? defaultDateTime : new Date(defaultDateTime)
}

/** True when calendar day changes or the clock gap is at least two hours. */
export function shouldShowDateSeparator(prevDate, nextDate, gapMs = DATE_SEPARATOR_GAP_MS) {
  if (!prevDate || !nextDate) return false
  const a = prevDate instanceof Date ? prevDate : new Date(prevDate)
  const b = nextDate instanceof Date ? nextDate : new Date(nextDate)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false
  if (!isSameCalendarDay(a, b)) return true
  return Math.abs(b.getTime() - a.getTime()) >= gapMs
}

/**
 * @param {Array} messages
 * @param {Date} defaultDateTime
 * @param {{ previousDate?: Date|null }} [options] — last effective date before this slice (cross-page)
 */
export function buildThreadItems(messages, defaultDateTime, options = {}) {
  const items = []
  let prevDate = options.previousDate ?? null

  messages.forEach((message, index) => {
    const effectiveDate = getEffectiveDateTime(messages, index, defaultDateTime)

    if (shouldShowDateSeparator(prevDate, effectiveDate)) {
      items.push({ type: 'date', dateTime: effectiveDate, key: `date-${message.id}` })
    }

    items.push({ type: 'message', message, index, key: message.id })
    prevDate = effectiveDate
  })

  return items
}

export function nextCalendarDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + 1)
  return d
}

/** Copy calendar day from `baseDate`, set clock to hours/minutes (seconds zeroed). */
export function withTimeOnDate(baseDate, hours, minutes) {
  const d = baseDate instanceof Date ? new Date(baseDate) : new Date(baseDate)
  d.setHours(hours, minutes, 0, 0)
  return d
}
