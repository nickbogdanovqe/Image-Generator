// Derives initials from the "Contact name / number" field, so the header
// avatar can show initials for names but keep the silhouette for numbers.

const PHONE_CHARS_RE = /[\s+()\-.]/g

function looksLikePhoneNumber(value) {
  const stripped = value.replace(PHONE_CHARS_RE, '')
  return stripped.length > 0 && /^\d+$/.test(stripped)
}

export function getInitials(contactName) {
  if (typeof contactName !== 'string') return null
  const trimmed = contactName.trim()
  if (!trimmed) return null
  if (looksLikePhoneNumber(trimmed)) return null

  const words = trimmed.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w))
  if (words.length === 0) return null

  const firstLetter = (word) => word.match(/[a-zA-Z]/)[0].toUpperCase()

  if (words.length === 1) {
    return firstLetter(words[0])
  }

  return firstLetter(words[0]) + firstLetter(words[words.length - 1])
}
