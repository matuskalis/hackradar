export type CalendarEvent = {
  id: string
  name: string
  description?: string | null
  start_at: string
  end_at: string
  url?: string | null
  venue_name?: string | null
  address?: string | null
  city?: string | null
}

/** RFC 5545 escaping: backslash first, then the delimiters. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function toUtcStamp(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Folds a content line to 75 octets, counting UTF-8 bytes rather than
 * characters so Slovak diacritics do not push a line over the limit.
 */
function fold(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const chunks: string[] = []
  let current = ''
  let bytes = 0
  // The first line holds 75 octets, continuations 74 plus the leading space.
  let budget = 75

  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > budget) {
      chunks.push(current)
      current = ''
      bytes = 0
      budget = 74
    }
    current += char
    bytes += size
  }
  if (current) chunks.push(current)

  return chunks.join('\r\n ')
}

export function toIcs(event: CalendarEvent, siteUrl: string): string {
  const location = [event.venue_name, event.address, event.city]
    .filter(Boolean)
    .join(', ')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HackRadar//SK//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@hackradar`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(event.start_at)}`,
    `DTEND:${toUtcStamp(event.end_at)}`,
    `SUMMARY:${escapeText(event.name)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  }
  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`)
  }
  lines.push(`URL:${escapeText(event.url ?? siteUrl)}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(fold).join('\r\n') + '\r\n'
}
