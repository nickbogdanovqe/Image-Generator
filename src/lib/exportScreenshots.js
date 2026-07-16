import { toPng } from 'html-to-image'
import { IPHONE_16_PRO_MAX } from './device.js'

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

/**
 * Capture exactly what is visible in the phone preview at the current scroll
 * position, at iPhone 16 Pro Max screenshot resolution (1320×2868).
 *
 * html-to-image clones the DOM with the native `cloneNode`, which never
 * copies live scroll offsets (`scrollTop` always resets to 0 on a clone).
 * To make the export match what's on screen, we temporarily shift the
 * live `.messages-content` node up by `scrollTop` with a CSS transform
 * (a real inline style, so it *is* preserved by cloneNode) and hide
 * overflow on `.messages` so only the shifted, visible slice is captured.
 * Both mutations are reverted in `finally`, regardless of success/failure.
 *
 * @param {HTMLElement} phoneEl — live `.phone` node from the preview
 */
export async function exportVisibleScreenshot(phoneEl) {
  if (!phoneEl) throw new Error('Phone preview is not ready')

  const messagesEl = phoneEl.querySelector('.messages')
  const contentEl = phoneEl.querySelector('.messages-content')
  const scrollTop = messagesEl?.scrollTop ?? 0

  phoneEl.classList.add('phone-capturing')

  const previousTransform = contentEl?.style.transform ?? ''
  const previousWillChange = contentEl?.style.willChange ?? ''
  if (contentEl && scrollTop > 0) {
    contentEl.style.transform = `translateY(-${scrollTop}px)`
    contentEl.style.willChange = 'transform'
  }

  try {
    const dataUrl = await toPng(phoneEl, {
      pixelRatio: IPHONE_16_PRO_MAX.scale,
      width: IPHONE_16_PRO_MAX.width,
      height: IPHONE_16_PRO_MAX.height,
      canvasWidth: IPHONE_16_PRO_MAX.pixelWidth,
      canvasHeight: IPHONE_16_PRO_MAX.pixelHeight,
      cacheBust: true,
      backgroundColor: '#ffffff',
      // Avoid expanding the capture to include scrollable overflow.
      style: {
        overflow: 'hidden',
      },
    })

    downloadDataUrl(dataUrl, 'imessage.png')
    return dataUrl
  } finally {
    if (contentEl) {
      contentEl.style.transform = previousTransform
      contentEl.style.willChange = previousWillChange
    }
    phoneEl.classList.remove('phone-capturing')
  }
}
