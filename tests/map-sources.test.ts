import { describe, expect, it } from 'vitest'
import { toSources } from '@/components/map/geojson'
import type { HackathonCard } from '@/lib/db/types'
import { formatDistance } from '@/lib/utils'

/**
 * The generated RPC type marks every returned column as non-null, but an online
 * event really does come back with null coordinates, so overrides are loose.
 */
function card(overrides: Record<string, unknown> = {}): HackathonCard {
  return {
    id: 'id-1',
    slug: 'hack-1',
    name: 'Hack',
    start_at: '2027-04-16T07:00:00Z',
    end_at: '2027-04-17T16:00:00Z',
    registration_deadline: null,
    timezone: 'Europe/Bratislava',
    format: 'onsite',
    city: 'Bratislava',
    country_code: 'SK',
    lat: 48.15,
    lng: 17.11,
    location_precision: 'venue',
    themes: [],
    price_cents: 0,
    currency: 'EUR',
    eligibility: null,
    distance_km: 1.2,
    ...overrides,
  } as unknown as HackathonCard
}

// The split is what keeps the map honest: an exact venue is a pin, a match that
// only knows the city is an area, and an online event has no place at all.
describe('toSources', () => {
  it('sends exact venues to the clustered source and city matches to the area source', () => {
    const { venues, cities } = toSources([
      card({ id: 'venue', location_precision: 'venue' }),
      card({ id: 'city', location_precision: 'city' }),
    ])

    expect(venues.features.map((feature) => feature.properties.id)).toEqual(['venue'])
    expect(cities.features.map((feature) => feature.properties.id)).toEqual(['city'])
  })

  it('leaves out events with no coordinates, such as online ones', () => {
    const { venues, cities } = toSources([
      card({ id: 'online', format: 'online', lat: null, lng: null, location_precision: null }),
    ])

    expect(venues.features).toHaveLength(0)
    expect(cities.features).toHaveLength(0)
  })

  it('writes coordinates as [lng, lat] and promotes the event id to the feature id', () => {
    const { venues } = toSources([card({ id: 'abc', lat: 48.15, lng: 17.11, format: 'hybrid' })])
    const [feature] = venues.features

    expect(feature.geometry.coordinates).toEqual([17.11, 48.15])
    expect(feature.id).toBe('abc')
    expect(feature.properties).toEqual({ id: 'abc', slug: 'hack-1', name: 'Hack', format: 'hybrid' })
  })
})

describe('formatDistance', () => {
  it.each([
    [null, 'online'],
    [0.4, 'menej než 1 km'],
    [12.4, '12 km'],
    [12.6, '13 km'],
  ])('%s becomes "%s"', (km, text) => {
    expect(formatDistance(km)).toBe(text)
  })
})
