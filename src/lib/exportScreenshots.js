import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { toPng } from 'html-to-image'
import Phone from '../components/Phone.jsx'
import {
  IPHONE_16_PRO_MAX,
  PAGE_SAFETY_MARGIN,
  MESSAGES_GAP,
} from './device.js'
import { buildThreadItems, getEffectiveDateTime } from './messageDates.js'
import {
  paginateThread,
  shrinkPageToFit,
  pageContentHeight,
} from './paginateThread.js'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function createHost() {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-9999px;top:0;pointer-events:none;opacity:0;'
  document.body.appendChild(host)
  return host
}

function mountPhone(host, props) {
  return new Promise((resolve) => {
    const root = createRoot(host)
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      const phoneEl = host.querySelector('.phone')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve({ root, phoneEl }))
      })
    }
    root.render(
      createElement(Phone, {
        ...props,
        ref: () => finish(),
      }),
    )
    setTimeout(finish, 400)
  })
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

function shouldShowReceipt(state) {
  const { messages, readLabel } = state
  const lastMeIndex = messages.reduce((acc, m, i) => (m.side === 'me' ? i : acc), -1)
  return Boolean(readLabel && lastMeIndex !== -1 && lastMeIndex === messages.length - 1)
}

async function measureThread(state) {
  const host = createHost()
  const showReceipt = shouldShowReceipt(state)
  const threadItems = buildThreadItems(state.messages, state.dateTime)
  const measureItems = showReceipt
    ? [...threadItems, { type: 'receipt', key: 'receipt' }]
    : [...threadItems]

  const { root, phoneEl } = await mountPhone(host, {
    state,
    measure: true,
    showReceipt,
  })

  try {
    if (!phoneEl) throw new Error('Phone failed to mount for measurement')

    const statusbar = phoneEl.querySelector('.statusbar')
    const header = phoneEl.querySelector('.header')
    const inputbar = phoneEl.querySelector('.inputbar')
    const messagesEl = phoneEl.querySelector('.messages')

    const chromeHeight =
      (statusbar?.offsetHeight ?? 0) +
      (header?.offsetHeight ?? 0) +
      (inputbar?.offsetHeight ?? 0)

    const maxHeight = IPHONE_16_PRO_MAX.height - chromeHeight
    const children = Array.from(messagesEl?.children ?? [])
    const heights = children.map((el) => el.offsetHeight)

    return {
      heights,
      items: measureItems.slice(0, heights.length),
      maxHeight,
      chromeHeight,
      showReceipt,
    }
  } finally {
    root.unmount()
    host.remove()
  }
}

function messagesInRange(items, start, end) {
  const out = []
  for (let i = start; i < end; i++) {
    if (items[i]?.type === 'message') out.push(items[i].message)
  }
  return out
}

function previousDateBefore(items, fullMessages, defaultDateTime, start) {
  for (let i = start - 1; i >= 0; i--) {
    if (items[i]?.type === 'message') {
      const idx = fullMessages.findIndex((m) => m.id === items[i].message.id)
      if (idx >= 0) return getEffectiveDateTime(fullMessages, idx, defaultDateTime)
    }
  }
  return null
}

function rangeIncludesReceipt(items, start, end) {
  for (let i = start; i < end; i++) {
    if (items[i]?.type === 'receipt') return true
  }
  return false
}

async function capturePage(state, pageProps, phoneHeight) {
  const host = createHost()
  const { root, phoneEl } = await mountPhone(host, {
    state,
    exportMode: true,
    phoneHeight: phoneHeight === IPHONE_16_PRO_MAX.height ? undefined : phoneHeight,
    ...pageProps,
  })

  try {
    if (!phoneEl) throw new Error('Phone failed to mount for export')

    const messagesEl = phoneEl.querySelector('.messages')
    const overflows =
      messagesEl &&
      phoneHeight <= IPHONE_16_PRO_MAX.height &&
      messagesEl.scrollHeight > messagesEl.clientHeight + 1

    if (overflows) {
      return { overflows: true, root, host, phoneEl }
    }

    const dataUrl = await toPng(phoneEl, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#ffffff',
      width: IPHONE_16_PRO_MAX.width,
      height: phoneHeight,
    })
    return { overflows: false, dataUrl, root, host }
  } catch (err) {
    root.unmount()
    host.remove()
    throw err
  }
}

/**
 * Export conversation as one or more iPhone 16 Pro Max screenshots.
 * Guarantees whole bubbles only — nothing is cut off mid-message.
 *
 * @param {object} state
 * @param {(info: { current: number, total: number }) => void} [onProgress]
 */
export async function exportScreenshots(state, onProgress) {
  const { heights, items, maxHeight, chromeHeight, showReceipt } =
    await measureThread(state)

  if (!heights.length) {
    onProgress?.({ current: 1, total: 1 })
    const { dataUrl, root, host } = await capturePage(
      state,
      { messagesOverride: [], showReceipt: false },
      IPHONE_16_PRO_MAX.height,
    )
    downloadDataUrl(dataUrl, 'imessage-1.png')
    root.unmount()
    host.remove()
    return
  }

  const pageOpts = {
    safetyMargin: PAGE_SAFETY_MARGIN,
    gap: MESSAGES_GAP,
    items,
  }

  const ranges = []
  let cursor = 0
  while (cursor < items.length) {
    const packed = paginateThread(heights.slice(cursor), maxHeight, {
      ...pageOpts,
      items: items.slice(cursor),
    })
    let end = cursor + packed[0].end
    end = shrinkPageToFit(cursor, end, heights, maxHeight, pageOpts)
    if (end <= cursor) end = cursor + 1
    ranges.push({ start: cursor, end })
    cursor = end
  }

  // Fit-check may split further; walk with a mutable queue
  const queue = [...ranges]
  const files = []
  let fileIndex = 0

  while (queue.length) {
    let { start, end } = queue.shift()
    fileIndex += 1
    onProgress?.({ current: fileIndex, total: fileIndex + queue.length })

    let pageMessages = messagesInRange(items, start, end)
    const prevDate = previousDateBefore(
      items,
      state.messages,
      state.dateTime,
      start,
    )
    let pageShowReceipt = showReceipt && rangeIncludesReceipt(items, start, end)

    const contentH = pageContentHeight(start, end, heights, MESSAGES_GAP)
    let phoneHeight = IPHONE_16_PRO_MAX.height
    if (contentH > maxHeight - PAGE_SAFETY_MARGIN) {
      phoneHeight = chromeHeight + contentH + PAGE_SAFETY_MARGIN
    }

    let result = await capturePage(
      state,
      {
        messagesOverride: pageMessages,
        previousEffectiveDate: prevDate,
        showReceipt: pageShowReceipt,
      },
      phoneHeight,
    )

    if (result.overflows && end > start + 1) {
      result.root.unmount()
      result.host.remove()

      const newEnd = shrinkPageToFit(start, end, heights, maxHeight, pageOpts)
      if (newEnd < end && newEnd > start) {
        queue.unshift({ start: newEnd, end })
        end = newEnd
        pageMessages = messagesInRange(items, start, end)
        pageShowReceipt = showReceipt && rangeIncludesReceipt(items, start, end)
        const contentH2 = pageContentHeight(start, end, heights, MESSAGES_GAP)
        phoneHeight =
          contentH2 > maxHeight - PAGE_SAFETY_MARGIN
            ? chromeHeight + contentH2 + PAGE_SAFETY_MARGIN
            : IPHONE_16_PRO_MAX.height
        result = await capturePage(
          state,
          {
            messagesOverride: pageMessages,
            previousEffectiveDate: prevDate,
            showReceipt: pageShowReceipt,
          },
          phoneHeight,
        )
      }
    }

    if (result.overflows) {
      // Last resort: grow page to fit measured content so nothing is clipped
      result.root?.unmount()
      result.host?.remove()
      const contentH3 = pageContentHeight(start, end, heights, MESSAGES_GAP)
      phoneHeight = chromeHeight + contentH3 + PAGE_SAFETY_MARGIN
      result = await capturePage(
        state,
        {
          messagesOverride: pageMessages,
          previousEffectiveDate: prevDate,
          showReceipt: pageShowReceipt,
        },
        phoneHeight,
      )
    }

    try {
      if (!result.dataUrl) {
        // Capture succeeded without overflows flag but no dataUrl means remount path needed
        const dataUrl = await toPng(result.phoneEl, {
          pixelRatio: 3,
          cacheBust: true,
          backgroundColor: '#ffffff',
          width: IPHONE_16_PRO_MAX.width,
          height: phoneHeight,
        })
        files.push(dataUrl)
        downloadDataUrl(dataUrl, `imessage-${fileIndex}.png`)
      } else {
        files.push(result.dataUrl)
        downloadDataUrl(result.dataUrl, `imessage-${fileIndex}.png`)
      }
    } finally {
      result.root?.unmount()
      result.host?.remove()
    }

    onProgress?.({ current: fileIndex, total: fileIndex + queue.length })
    await sleep(350)
  }

  return files
}
