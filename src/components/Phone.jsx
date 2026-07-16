import { forwardRef, useId } from 'react'
import { formatDateLine } from '../lib/formatDate.js'
import { buildThreadItems, getEffectiveDateTime } from '../lib/messageDates.js'
import { getInitials } from '../lib/contactName.js'

// ---------- small SVG / glyph pieces ----------

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
        fill="#000"
      />
    </svg>
  )
}

function SignalIcon() {
  return (
    <svg width="20" height="13" viewBox="0 0 20 13" aria-hidden="true">
      <rect x="0" y="9" width="3.2" height="4" rx="1" fill="#000" />
      <rect x="5.4" y="6" width="3.2" height="7" rx="1" fill="#000" />
      <rect x="10.8" y="3" width="3.2" height="10" rx="1" fill="#000" />
      <rect x="16.2" y="0" width="3.2" height="13" rx="1" fill="#000" opacity="0.3" />
    </svg>
  )
}

function BatteryIcon({ level = 36 }) {
  return (
    <span className="battery">
      <span className="battery-num">{level}</span>
      <span className="battery-body">
        <span className="battery-fill" style={{ width: `${Math.max(0, Math.min(100, level))}%` }} />
      </span>
      <span className="battery-cap" />
    </span>
  )
}

function AvatarIcon({ gradientId = 'avatarGrad' }) {
  return (
    <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9AEC4" />
          <stop offset="1" stopColor="#8A90AE" />
        </linearGradient>
      </defs>
      <circle cx="37" cy="37" r="37" fill={`url(#${gradientId})`} />
      <circle cx="37" cy="29" r="13" fill="#fff" />
      <path d="M37 45c-12 0-21 7-21 16v13h42V61c0-9-9-16-21-16z" fill="#fff" />
    </svg>
  )
}

function InitialsAvatar({ initials, gradientId = 'avatarGrad' }) {
  return (
    <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9AEC4" />
          <stop offset="1" stopColor="#8A90AE" />
        </linearGradient>
      </defs>
      <circle cx="37" cy="37" r="37" fill={`url(#${gradientId})`} />
      <text
        x="37"
        y="37"
        textAnchor="middle"
        dominantBaseline="central"
        className="avatar-initials"
        // Inline styling is required in addition to the CSS class: html-to-image
        // (used for PNG export) clones <svg> subtrees natively without inlining
        // computed CSS, and the exported SVG has no access to styles.css, so
        // class-only styling silently disappears from the saved image.
        style={{
          fill: '#fff',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        {initials}
      </text>
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true">
      <rect x="5" y="1" width="6" height="11" rx="3" fill="#8E8E93" />
      <path d="M2 9a6 6 0 0 0 12 0" stroke="#8E8E93" strokeWidth="1.6" fill="none" />
      <line x1="8" y1="15" x2="8" y2="20" stroke="#8E8E93" strokeWidth="1.6" />
    </svg>
  )
}

// ---------- main component ----------

const Phone = forwardRef(function Phone({ state }, ref) {
  const avatarGradId = useId().replace(/:/g, '')

  const {
    style,
    statusTime,
    doNotDisturb,
    contactName,
    dateTime,
    readLabel,
    readTime,
    unreadBadge,
    messages,
  } = state

  const initials = getInitials(contactName)

  const threadItems = buildThreadItems(messages, dateTime)

  const dateLine = formatDateLine(
    messages.length ? getEffectiveDateTime(messages, 0, dateTime) : dateTime,
  )

  const lastMeIndex = messages.reduce((acc, m, i) => (m.side === 'me' ? i : acc), -1)
  const showReceipt =
    readLabel && lastMeIndex !== -1 && lastMeIndex === messages.length - 1

  return (
    <div className={`phone style-${style}`} ref={ref}>
      {/* status bar */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span className="clock">{statusTime}</span>
          {doNotDisturb ? <MoonIcon /> : null}
        </div>
        <div className="statusbar-right">
          <SignalIcon />
          <span className="net">
            5G<sup>UC</sup>
          </span>
          <BatteryIcon level={36} />
        </div>
      </div>

      {/* header */}
      <div className="header">
        <div className="back">
          <span className="chevron-back">‹</span>
          {unreadBadge ? <span className="back-badge">{unreadBadge}</span> : null}
        </div>
        <div className="header-center">
          {initials ? (
            <InitialsAvatar initials={initials} gradientId={`avatarGrad-${avatarGradId}`} />
          ) : (
            <AvatarIcon gradientId={`avatarGrad-${avatarGradId}`} />
          )}
          <div className="contact-pill">
            <span className="contact-name">{contactName}</span>
            <span className="chevron-fwd">›</span>
          </div>
        </div>
      </div>

      {/* messages — RCS label + date scroll with the thread (like iPhone) */}
      <div className="messages">
        <div className="thread-meta">
          <div className="sublabel">Text Message • RCS</div>
          <div className="dateline">{dateLine}</div>
        </div>
        {threadItems.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} className="date-separator">
                {formatDateLine(item.dateTime)}
              </div>
            )
          }

          const { message, index } = item
          const next = messages[index + 1]
          const isLastOfRun = !next || next.side !== message.side
          return (
            <div key={item.key} className={`row ${message.side}`}>
              <div className={`bubble ${message.side} ${isLastOfRun ? 'tail' : ''}`}>
                {message.text}
              </div>
            </div>
          )
        })}
        {showReceipt ? (
          <div className="receipt">
            <span className="receipt-label">{readLabel}</span> {readTime}
          </div>
        ) : null}
      </div>

      {/* input bar */}
      <div className="inputbar">
        <div className="plus">+</div>
        <div className="textfield">
          <span className="placeholder">Text Message • RCS</span>
          <MicIcon />
        </div>
      </div>
    </div>
  )
})

export default Phone
