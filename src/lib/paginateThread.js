/**
 * Pack measured thread items into pages that fit within maxHeight.
 * Items are atomic — never split mid-bubble.
 *
 * @param {number[]} heights - offsetHeight of each thread item in order
 * @param {number} maxHeight - messages viewport height
 * @param {{ safetyMargin?: number, gap?: number, items?: Array<{ type: string }> }} options
 * @returns {{ start: number, end: number }[]} page ranges [start, end) into heights/items
 */
export function paginateThread(heights, maxHeight, options = {}) {
  const safetyMargin = options.safetyMargin ?? 4
  const gap = options.gap ?? 4
  const items = options.items ?? null
  const limit = Math.max(0, maxHeight - safetyMargin)

  if (!heights.length) return [{ start: 0, end: 0 }]

  const pages = []
  let start = 0

  while (start < heights.length) {
    let used = 0
    let end = start

    while (end < heights.length) {
      const itemH = heights[end]

      // Keep date separator with the following message when possible
      if (items?.[end]?.type === 'date' && end + 1 < heights.length) {
        const pairH = itemH + gap + heights[end + 1]
        const pairUsed = used + (end > start ? gap : 0) + pairH
        if (pairUsed > limit && end > start) break
        used = pairUsed
        end += 2
        if (used > limit) break
        continue
      }

      const nextUsed = used + (end > start ? gap : 0) + itemH
      if (nextUsed > limit && end > start) break

      used = nextUsed
      end += 1

      // Single item taller than viewport — alone on page (caller may grow height)
      if (used > limit) break
    }

    if (end === start) end = start + 1 // force progress
    pages.push({ start, end })
    start = end
  }

  return pages
}

/**
 * After a page mounts, if content overflows, shrink the range from the end.
 * Returns a new end index (exclusive) that fits, or start+1 minimum.
 */
export function shrinkPageToFit(start, end, heights, maxHeight, options = {}) {
  const safetyMargin = options.safetyMargin ?? 4
  const gap = options.gap ?? 4
  const items = options.items ?? null
  const limit = Math.max(0, maxHeight - safetyMargin)
  let e = end

  while (e > start + 1) {
    let used = 0
    for (let i = start; i < e; i++) {
      used += heights[i] + (i > start ? gap : 0)
    }
    if (used <= limit) break
    e -= 1
    // Don't orphan a date separator
    if (items?.[e]?.type === 'date' || items?.[e - 1]?.type === 'date') {
      if (e > start + 1 && items?.[e - 1]?.type === 'date') e -= 1
    }
  }

  return e
}

export function pageContentHeight(start, end, heights, gap = 4) {
  let used = 0
  for (let i = start; i < end; i++) {
    used += heights[i] + (i > start ? gap : 0)
  }
  return used
}
