import type { Importer, NormalizedHackathon } from './lib/types'

const BASE = 'https://www.mlh.com'

type MlhEvent = {
  id: string
  name: string
  status: string
  startsAt: string
  endsAt: string
  url?: string | null
  websiteUrl?: string | null
  formatType: 'physical' | 'digital'
  venueAddress?: { city?: string; state?: string; country?: string } | null
}

/** MLH labels the season by the year it ends in; it rolls over in autumn. */
export function currentSeason(now = new Date()): number {
  return now.getUTCMonth() >= 7 ? now.getUTCFullYear() + 1 : now.getUTCFullYear()
}

/**
 * The events page is an Inertia app: with the version handshake it answers
 * with JSON, so no HTML parsing is needed. A rotated version returns 409, and
 * the version is read again from the page.
 */
async function fetchInertia(season: number): Promise<unknown> {
  const url = `${BASE}/seasons/${season}/events`
  const headers = { 'User-Agent': 'HackRadar/0.1 (hackathon map, central europe)' }

  const page = await fetch(url, { headers })
  if (!page.ok) throw new Error(`mlh page ${page.status}`)

  const html = await page.text()
  const version = html.match(/"version":"([0-9a-f]{20,})"/)?.[1]
  if (!version) throw new Error('mlh: no Inertia version in page markup')

  const json = await fetch(url, {
    headers: { ...headers, 'X-Inertia': 'true', 'X-Inertia-Version': version, Accept: 'application/json' },
  })
  if (!json.ok) throw new Error(`mlh inertia ${json.status}`)

  return json.json()
}

export function parse(raw: unknown): NormalizedHackathon[] {
  const events = (raw as { props?: { upcomingEvents?: MlhEvent[] } })?.props?.upcomingEvents
  if (!Array.isArray(events)) throw new Error('mlh: upcomingEvents missing')

  return events.flatMap((event) => {
    if (event.status === 'ended') return []

    const online = event.formatType === 'digital'
    const website = event.websiteUrl ?? null

    return [
      {
        name: event.name,
        start_at: new Date(event.startsAt).toISOString(),
        end_at: new Date(event.endsAt).toISOString(),
        timezone: 'UTC',
        format: online ? 'online' : 'onsite',
        city: online ? null : (event.venueAddress?.city ?? null),
        country_code: online ? null : (event.venueAddress?.country ?? null),
        location_precision: online ? null : 'city',
        url: website,
        registration_url: website,
        organizer_name: 'Major League Hacking',
        source: 'mlh',
        source_id: event.id,
        source_url: event.url ? `${BASE}${event.url}` : null,
      } satisfies NormalizedHackathon,
    ]
  })
}

export const mlh: Importer = {
  source: 'mlh',
  fetchRaw: () => fetchInertia(currentSeason()),
  parse,
}
