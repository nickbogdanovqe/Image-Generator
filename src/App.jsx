import { useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import Phone from './components/Phone.jsx'
import Editor from './components/Editor.jsx'
import { formatDateLine } from './lib/formatDate.js'

let nextId = 100
const makeId = () => ++nextId

// Default conversation seeds the app to match the reference image out of the box.
const DEFAULT_STATE = {
  style: 'green', // 'green' (RCS/SMS) | 'blue' (iMessage)
  statusTime: '5:13', // status-bar clock
  doNotDisturb: true, // status-bar moon (Do Not Disturb / Focus) on/off
  contactName: '+1 (720) 266-8164',
  dateTime: new Date(), // conversation date — rendered Apple-style by formatDateLine()
  readLabel: 'Read', // 'Read' | 'Delivered' | '' (off)
  readTime: '5:05 PM',
  unreadBadge: '1',
  messages: [
    { id: 1, side: 'them', text: 'C' },
    { id: 2, side: 'me', text: 'Вечер в хату' },
    { id: 3, side: 'them', text: '100%' },
    { id: 4, side: 'me', text: 'Пошли в стрипуху, забей на жену' },
    { id: 5, side: 'them', text: 'Tests run Whitley, everyone is happy' },
    { id: 6, side: 'me', text: 'Тесты крутятся, лавеха мутится' },
    { id: 7, side: 'them', text: 'After release we can be free and do whatever. Take some time off' },
    { id: 8, side: 'me', text: 'Of course, right after release, I plan to grab a pack of THC drinks and get shitfaced.' },
    { id: 9, side: 'them', text: 'Jamila' },
    { id: 10, side: 'them', text: 'Hanuka' },
    { id: 11, side: 'me', text: 'Mabel Tov!' },
    { id: 12, side: 'me', text: 'Mazel Tov!' },
  ],
}

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [busy, setBusy] = useState(false)
  const phoneRef = useRef(null)

  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }))
  }, [])

  // ----- message operations -----
  const addMessage = useCallback((side = 'me') => {
    setState((s) => ({
      ...s,
      messages: [...s.messages, { id: makeId(), side, text: '' }],
    }))
  }, [])

  const updateMessage = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }, [])

  const removeMessage = useCallback((id) => {
    setState((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== id) }))
  }, [])

  const moveMessage = useCallback((id, dir) => {
    setState((s) => {
      const idx = s.messages.findIndex((m) => m.id === id)
      const swap = idx + dir
      if (idx < 0 || swap < 0 || swap >= s.messages.length) return s
      const messages = [...s.messages]
      ;[messages[idx], messages[swap]] = [messages[swap], messages[idx]]
      return { ...s, messages }
    })
  }, [])

  // ----- export -----
  const handleExport = useCallback(async () => {
    const node = phoneRef.current
    if (!node) return
    setBusy(true)
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = 'imessage.png'
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed', err)
      alert('Sorry, the screenshot export failed. See the console for details.')
    } finally {
      setBusy(false)
    }
  }, [])

  return (
    <div className="app">
      <Editor
        state={state}
        update={update}
        addMessage={addMessage}
        updateMessage={updateMessage}
        removeMessage={removeMessage}
        moveMessage={moveMessage}
        onExport={handleExport}
        busy={busy}
      />
      <div className="preview">
        <Phone ref={phoneRef} state={state} />
      </div>
    </div>
  )
}
