import type { Importer, NormalizedHackathon } from './lib/types'

// The trailing slash matters; without it the API answers 308.
const ENDPOINT = 'https://hackathons.hackclub.com/api/events/upcoming/'

type HackClubEvent = {
  id: string
  name: string
  website?: string | null
  start: string
  end: string
  city?: string | null
  country?: string | null
  countryCode?: string | null
  latitude?: number | null
  longitude?: number | null
  virtual: boolean
  hybrid: boolean
}

export function parse(raw: unknown): NormalizedHackathon[] {
  if (!Array.isArray(raw)) throw new Error('hackclub: expected an array of events')

  return (raw as HackClubEvent[]).map((event) => {
    const format = event.virtual ? 'online' : event.hybrid ? 'hybrid' : 'onsite'
    const hasPoint =
      format !== 'online' && event.latitude != null && event.longitude != null

    return {
      name: event.name,
      start_at: new Date(event.start).toISOString(),
      end_at: new Date(event.end).toISOString(),
      timezone: 'UTC',
      format,
      city: format === 'online' ? null : (event.city ?? null),
      country_code: format === 'online' ? null : (event.countryCode ?? null),
      // Hack Club ships coordinates, so these rows never need geocoding.
      lat: hasPoint ? event.latitude : null,
      lng: hasPoint ? event.longitude : null,
      location_precision: hasPoint ? 'venue' : null,
      url: event.website ?? null,
      registration_url: event.website ?? null,
      source: 'hackclub',
      source_id: event.id,
      source_url: 'https://hackathons.hackclub.com/',
    } satisfies NormalizedHackathon
  })
}

export const hackclub: Importer = {
  source: 'hackclub',
  fetchRaw: async () => {
    const response = await fetch(ENDPOINT, {
      headers: { 'User-Agent': 'HackRadar/0.1 (hackathon map, central europe)' },
    })
    if (!response.ok) throw new Error(`hackclub ${response.status}`)
    return response.json()
  },
  parse,
}
