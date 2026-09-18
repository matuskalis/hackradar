import type { EditableHackathon } from '@/components/admin/HackathonEditForm'
import type { ExtractedFields } from '@/lib/extract/event-from-html'

export const DEFAULT_TIMEZONE = 'Europe/Bratislava'

const HAS_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/i
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** How far the zone is from UTC at that instant, in minutes. */
function offsetMinutes(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value)

  const asUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour') % 24,
    part('minute'),
    part('second')
  )
  return (asUtc - instant) / 60_000
}

/**
 * A page can state an instant ("2027-04-16T09:00:00+02:00"), a wall-clock time
 * with no offset, or a bare date. The last two only mean something in the
 * event's own zone, so they are resolved there; the second pass catches the
 * hour around a DST change, where the first offset belongs to the wrong side.
 */
function instantOf(value: string, timeZone: string): number | null {
  const text = value.trim()
  // `Date.parse` reads "jar 2027" as the first of January; only ISO is a date.
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return null

  if (HAS_OFFSET.test(text)) {
    const parsed = Date.parse(text)
    return Number.isNaN(parsed) ? null : parsed
  }

  const local = DATE_ONLY.test(text) ? `${text}T00:00:00` : text
  const guess = Date.parse(`${local}Z`)
  if (Number.isNaN(guess)) return null

  const first = guess - offsetMinutes(guess, timeZone) * 60_000
  return guess - offsetMinutes(first, timeZone) * 60_000
}

/**
 * ISO 8601 in the event's timezone, the shape `adminEditSchema` demands and the
 * shape an admin can read without converting from UTC in their head.
 */
export function toIsoWithOffset(value: string, timeZone: string): string | null {
  const instant = instantOf(value, timeZone)
  if (instant == null) return null

  const offset = offsetMinutes(instant, timeZone)
  const sign = offset < 0 ? '-' : '+'
  const absolute = Math.abs(offset)
  const local = new Date(instant + offset * 60_000)

  return `${local.toISOString().slice(0, 19)}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

export function blankFormValues(): EditableHackathon {
  return {
    id: null,
    name: '',
    description: null,
    start_at: '',
    end_at: '',
    timezone: DEFAULT_TIMEZONE,
    format: 'onsite',
    recurrence: 'none',
    venue_name: null,
    address: null,
    city: null,
    country_code: null,
    lat: null,
    lng: null,
    location_precision: null,
    url: null,
    registration_url: null,
    registration_deadline: null,
    themes: [],
    eligibility: null,
    price_cents: null,
    currency: 'EUR',
    prizes: null,
    capacity: null,
    organizer_name: null,
  }
}

/**
 * Extraction output to form values. Nothing is invented: a field the page did
 * not state stays empty and is listed in `missing` for the admin to fill.
 */
export function formValuesFromExtraction(
  fields: ExtractedFields,
  pageUrl: string
): EditableHackathon {
  const timezone = fields.timezone ?? DEFAULT_TIMEZONE
  const date = (value: string | undefined) =>
    (value ? toIsoWithOffset(value, timezone) : null) ?? ''

  return {
    ...blankFormValues(),
    name: fields.name ?? '',
    description: fields.description ?? null,
    start_at: date(fields.start_at),
    end_at: date(fields.end_at),
    timezone,
    format: fields.format ?? 'onsite',
    venue_name: fields.venue_name ?? null,
    address: fields.address ?? null,
    city: fields.city ?? null,
    country_code: fields.country_code ?? null,
    url: fields.url ?? pageUrl,
    registration_url: fields.registration_url ?? null,
    price_cents: fields.price_cents ?? null,
    currency: fields.currency ?? 'EUR',
    organizer_name: fields.organizer_name ?? null,
  }
}
