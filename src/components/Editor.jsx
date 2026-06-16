export default function Editor({
  state,
  update,
  addMessage,
  updateMessage,
  removeMessage,
  moveMessage,
  onExport,
  busy,
}) {
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
          Date line
          <input
            type="text"
            value={state.dateLine}
            onChange={(e) => update({ dateLine: e.target.value })}
          />
        </label>
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
          {state.messages.map((m, i) => (
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
              <textarea
                rows={2}
                value={m.text}
                placeholder="Message text…"
                onChange={(e) => updateMessage(m.id, { text: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="add-row">
          <button onClick={() => addMessage('me')}>+ Add from Me</button>
          <button onClick={() => addMessage('them')}>+ Add from Them</button>
        </div>
      </section>

      <button className="export" onClick={onExport} disabled={busy}>
        {busy ? 'Saving…' : '⤓ Save as image'}
      </button>
    </div>
  )
}
