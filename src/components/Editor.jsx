import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { formatDateLine } from '../lib/formatDate.js'
import { getEffectiveDateTime } from '../lib/messageDates.js'

export default function Editor({
  state,
  update,
  addMessage,
  updateMessage,
  removeMessage,
  moveMessage,
  startNewDay,
  onExport,
  busy,
  exportProgress,
}) {
  const [datePickerOpen, setDatePickerOpen] = useState({})

  const toggleDatePicker = (id) => {
    setDatePickerOpen((open) => ({ ...open, [id]: !open[id] }))
  }

  const clearMessageDate = (id) => {
    setDatePickerOpen((open) => {
      const next = { ...open }
      delete next[id]
      return next
    })
    updateMessage(id, { dateTime: undefined })
  }
  return (
    <div className="editor">
      <h1>iMessage Screenshot Generator</h1>

      <section>
        <h2>Style</h2>
        <div className="seg">
          <button
            className={state.style === 'green' ? 'active' : ''}
            onClick={() => update({ style: 'green' })}
          >
            Green (RCS)
          </button>
          <button
            className={state.style === 'blue' ? 'active' : ''}
            onClick={() => update({ style: 'blue' })}
          >
            Blue (iMessage)
          </button>
        </div>
      </section>

      <section>
        <h2>Status bar</h2>
        <div className="row-2">
          <label>
            Time
            <input
              type="text"
              value={state.statusTime}
              onChange={(e) => update({ statusTime: e.target.value })}
            />
          </label>
          <label className="toggle-label">
            Do Not Disturb
            <button
              type="button"
              role="switch"
              aria-checked={state.doNotDisturb}
              className={`toggle ${state.doNotDisturb ? 'on' : ''}`}
              onClick={() => update({ doNotDisturb: !state.doNotDisturb })}
            >
              <span className="toggle-knob" />
            </button>
          </label>
        </div>
        <p className="hint">The moon icon shows next to the clock when on.</p>
      </section>

      <section>
        <h2>Header</h2>
        <label>
          Contact name / number
          <input
            type="text"
            value={state.contactName}
            onChange={(e) => update({ contactName: e.target.value })}
          />
        </label>
        <label>
          Conversation date &amp; time
          <DatePicker
            selected={state.dateTime}
            onChange={(date) => date && update({ dateTime: date })}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={5}
            timeCaption="Time"
            dateFormat="EEE, MMM d 'at' HH:mm"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            maxDate={new Date()}
            popperPlacement="bottom-start"
            wrapperClassName="datepicker-wrap"
            className="datepicker-input"
          />
        </label>
        <p className="hint">
          Default date for messages until a new day is set on a specific message.
        </p>
        <p className="hint">
          Preview: <strong>{formatDateLine(state.dateTime)}</strong>
        </p>
        <label>
          Back-button unread badge
          <input
            type="text"
            value={state.unreadBadge}
            placeholder="(leave blank to hide)"
            onChange={(e) => update({ unreadBadge: e.target.value })}
          />
        </label>
      </section>

      <section>
        <h2>Read indicator (last sent message)</h2>
        <div className="row-2">
          <label>
            Type
            <select
              value={state.readLabel}
              onChange={(e) => update({ readLabel: e.target.value })}
            >
              <option value="Read">Read</option>
              <option value="Delivered">Delivered</option>
              <option value="">None</option>
            </select>
          </label>
          <label>
            Time
            <input
              type="text"
              value={state.readTime}
              disabled={!state.readLabel}
              onChange={(e) => update({ readTime: e.target.value })}
            />
          </label>
        </div>
        <p className="hint">
          Only shows when the last message in the thread is from you (Me).
        </p>
      </section>

      <section>
        <h2>Messages</h2>
        <div className="msg-list">
          {state.messages.map((m, i) => {
            const effectiveDate = getEffectiveDateTime(state.messages, i, state.dateTime)
            return (
            <div key={m.id} className="msg-edit">
              <div className="msg-edit-top">
                <div className="seg small">
                  <button
                    className={m.side === 'me' ? 'active' : ''}
                    onClick={() => updateMessage(m.id, { side: 'me' })}
                  >
                    Me
                  </button>
                  <button
                    className={m.side === 'them' ? 'active' : ''}
                    onClick={() => updateMessage(m.id, { side: 'them' })}
                  >
                    Them
                  </button>
                </div>
                <div className="msg-actions">
                  <button
                    title="Move up"
                    disabled={i === 0}
                    onClick={() => moveMessage(m.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    title="Move down"
                    disabled={i === state.messages.length - 1}
                    onClick={() => moveMessage(m.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    title="Remove"
                    className="danger"
                    onClick={() => removeMessage(m.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="msg-date">
                <span className="msg-date-label">
                  Day: <strong>{formatDateLine(effectiveDate)}</strong>
                  {m.dateTime ? ' (custom)' : ''}
                </span>
                <div className="msg-date-actions">
                  <button type="button" onClick={() => startNewDay(m.id)}>
                    New day
                  </button>
                  <button type="button" onClick={() => toggleDatePicker(m.id)}>
                    {datePickerOpen[m.id] ? 'Hide date' : 'Set date'}
                  </button>
                  {m.dateTime ? (
                    <button type="button" onClick={() => clearMessageDate(m.id)}>
                      Clear date
                    </button>
                  ) : null}
                </div>
              </div>
              {datePickerOpen[m.id] ? (
                <div className="msg-date-picker">
                  <DatePicker
                    selected={m.dateTime ?? effectiveDate}
                    onChange={(date) => date && updateMessage(m.id, { dateTime: date })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={5}
                    timeCaption="Time"
                    dateFormat="EEE, MMM d 'at' HH:mm"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    popperPlacement="bottom-start"
                    wrapperClassName="datepicker-wrap"
                    className="datepicker-input"
                  />
                </div>
              ) : null}
              <textarea
                rows={2}
                value={m.text}
                placeholder="Message text…"
                onChange={(e) => updateMessage(m.id, { text: e.target.value })}
              />
            </div>
            )
          })}
        </div>
        <div className="add-row">
          <button onClick={() => addMessage('me')}>+ Add from Me</button>
          <button onClick={() => addMessage('them')}>+ Add from Them</button>
        </div>
      </section>

      <button className="export" onClick={onExport} disabled={busy}>
        {busy
          ? exportProgress
            ? `Saving ${exportProgress.current}/${exportProgress.total}…`
            : 'Saving…'
          : '⤓ Save as image(s)'}
      </button>
    </div>
  )
}
