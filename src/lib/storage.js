const STORAGE_KEY = 'imessage-screen-generator:conversation'

function reviveDates(raw) {
  if (!raw || typeof raw !== 'object') return null

  const dateTime = new Date(raw.dateTime)
  if (Number.isNaN(dateTime.getTime())) return null

  if (!Array.isArray(raw.messages)) return null

  const messages = raw.messages.map((m) => {
    if (!m || typeof m !== 'object') return null
    const msg = {
      id: m.id,
      side: m.side === 'them' ? 'them' : 'me',
      text: typeof m.text === 'string' ? m.text : '',
    }
    if (m.dateTime) {
      const d = new Date(m.dateTime)
      if (!Number.isNaN(d.getTime())) msg.dateTime = d
    }
    return msg
  })

  if (messages.some((m) => m == null || m.id == null)) return null

  return {
    style: raw.style === 'blue' ? 'blue' : 'green',
    statusTime: typeof raw.statusTime === 'string' ? raw.statusTime : '5:13',
    doNotDisturb: Boolean(raw.doNotDisturb),
    contactName: typeof raw.contactName === 'string' ? raw.contactName : '',
    dateTime,
    readLabel: typeof raw.readLabel === 'string' ? raw.readLabel : 'Read',
    readTime: typeof raw.readTime === 'string' ? raw.readTime : '',
    unreadBadge: typeof raw.unreadBadge === 'string' ? raw.unreadBadge : '',
    messages,
  }
}

function serialize(state) {
  return JSON.stringify({
    ...state,
    dateTime: state.dateTime instanceof Date ? state.dateTime.toISOString() : state.dateTime,
    messages: state.messages.map((m) => {
      const out = { id: m.id, side: m.side, text: m.text }
      if (m.dateTime) {
        out.dateTime =
          m.dateTime instanceof Date ? m.dateTime.toISOString() : m.dateTime
      }
      return out
    }),
  })
}

/** Load saved conversation from localStorage, or null if missing/invalid. */
export function loadConversation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return reviveDates(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Persist conversation to localStorage (survives refresh & browser restart). */
export function saveConversation(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state))
  } catch (err) {
    console.warn('Could not save conversation', err)
  }
}

/** Highest message id in state — used to keep id generation collision-free. */
export function maxMessageId(state) {
  if (!state?.messages?.length) return 0
  return state.messages.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0)
}
