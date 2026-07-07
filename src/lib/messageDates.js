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

export function buildThreadItems(messages, defaultDateTime) {
  const items = []
  let prevDate = null

  messages.forEach((message, index) => {
    const effectiveDate = getEffectiveDateTime(messages, index, defaultDateTime)

    if (index > 0 && prevDate && !isSameCalendarDay(prevDate, effectiveDate)) {
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
