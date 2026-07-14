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

    const showSeparator =
      (index > 0 && prevDate && !isSameCalendarDay(prevDate, effectiveDate)) ||
      (index === 0 && prevDate && !isSameCalendarDay(prevDate, effectiveDate))

    if (showSeparator) {
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
