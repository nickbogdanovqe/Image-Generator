import { toPng } from 'html-to-image'
import { IPHONE_16_PRO_MAX } from './device.js'

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

function stripScrollbars(el) {
  if (!el) return
  el.style.setProperty('overflow', 'hidden', 'important')
  el.style.setProperty('overflow-x', 'hidden', 'important')
  el.style.setProperty('overflow-y', 'hidden', 'important')
  el.style.setProperty('scrollbar-width', 'none', 'important')
  el.style.setProperty('-ms-overflow-style', 'none', 'important')
}

/**
 * Capture exactly what is visible in the phone preview at the current scroll
 * position, at iPhone 16 Pro Max screenshot resolution (1320×2868).
 *
 * @param {HTMLElement} phoneEl — live `.phone` node from the preview
 */
export async function exportVisibleScreenshot(phoneEl) {
  if (!phoneEl) throw new Error('Phone preview is not ready')

  const messagesEl = phoneEl.querySelector('.messages')
  const scrollTop = messagesEl?.scrollTop ?? 0
  const gap = messagesEl ? getComputedStyle(messagesEl).gap || '4px' : '4px'

  // Apply on the live node too — html-to-image often paints native scrollbars
  // from the source element even when the clone hides them.
  phoneEl.classList.add('phone-capturing')

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
      onclone: (clonedDoc, clonedPhone) => {
        const style = clonedDoc.createElement('style')
        style.textContent = `
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            background: transparent !important;
          }
          .phone,
          .phone * {
            overflow-x: hidden !important;
          }
          .messages {
            overflow: hidden !important;
            overflow-x: hidden !important;
            overflow-y: hidden !important;
          }
        `
        clonedDoc.head.appendChild(style)

        stripScrollbars(clonedPhone)
        const clonedMessages = clonedPhone.querySelector('.messages')
        stripScrollbars(clonedMessages)

        // html-to-image often resets scrollTop; shift content instead so the
        // visible viewport matches what the user scrolled to.
        if (clonedMessages && scrollTop > 0) {
          const wrapper = clonedDoc.createElement('div')
          wrapper.style.display = 'flex'
          wrapper.style.flexDirection = 'column'
          wrapper.style.gap = gap
          wrapper.style.transform = `translateY(-${scrollTop}px)`
          wrapper.style.willChange = 'transform'
          wrapper.style.width = '100%'
          wrapper.style.maxWidth = '100%'
          wrapper.style.overflow = 'visible'
          while (clonedMessages.firstChild) {
            wrapper.appendChild(clonedMessages.firstChild)
          }
          clonedMessages.appendChild(wrapper)
        }
      },
    })

    downloadDataUrl(dataUrl, 'imessage.png')
    return dataUrl
  } finally {
    phoneEl.classList.remove('phone-capturing')
  }
}
