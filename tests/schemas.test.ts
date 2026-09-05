import { describe, expect, it } from 'vitest'
import {
  csvRowSchema,
  hackathonsQuerySchema,
  submitSchema,
} from '@/lib/validation/schemas'

const validSubmit = {
  name: 'Hack Bratislava',
  start_at: '2027-03-01T09:00:00+01:00',
  end_at: '2027-03-02T18:00:00+01:00',
  timezone: 'Europe/Bratislava',
  format: 'onsite' as const,
  city: 'Bratislava',
  country_code: 'SK' as const,
  url: 'https://example.sk/hack',
  organizer_name: 'FIIT STU',
  themes: ['ai'],
}

describe('hackathonsQuerySchema', () => {
  it('accepts a radius query and defaults the radius', () => {
    const result = hackathonsQuerySchema.safeParse({ lat: '48.1486', lng: '17.1077' })
    expect(result.success).toBe(true)
    if (result.success && !('bbox' in result.data)) {
      expect(result.data.radius).toBe(50)
      expect(result.data.lat).toBeCloseTo(48.1486)
    }
  })

  it('rejects a radius outside the offered options', () => {
    const result = hackathonsQuerySchema.safeParse({
      lat: '48.1', lng: '17.1', radius: '73',
    })
    expect(result.success).toBe(false)
  })

  it('parses a bbox into four numbers', () => {
    const result = hackathonsQuerySchema.safeParse({ bbox: '16.5,47.9,17.8,48.5' })
    expect(result.success).toBe(true)
    if (result.success && 'bbox' in result.data) {
      expect(result.data.bbox).toEqual([16.5, 47.9, 17.8, 48.5])
    }
  })

  it('rejects a bbox with swapped corners', () => {
    const result = hackathonsQuerySchema.safeParse({ bbox: '17.8,48.5,16.5,47.9' })
    expect(result.success).toBe(false)
  })

  it('splits comma separated filters', () => {
    const result = hackathonsQuerySchema.safeParse({
      lat: '48.1', lng: '17.1', format: 'onsite,hybrid', themes: 'ai,web', free: 'true',
    })
    expect(result.success).toBe(true)
    if (result.success && !('bbox' in result.data)) {
      expect(result.data.format).toEqual(['onsite', 'hybrid'])
      expect(result.data.themes).toEqual(['ai', 'web'])
      expect(result.data.free).toBe(true)
    }
  })

  it('rejects an unknown theme', () => {
    const result = hackathonsQuerySchema.safeParse({
      lat: '48.1', lng: '17.1', themes: 'ai,definitely-not-a-theme',
    })
    expect(result.success).toBe(false)
  })
})

describe('submitSchema', () => {
  it('accepts a complete on-site submission', () => {
    expect(submitSchema.safeParse(validSubmit).success).toBe(true)
  })

  it('rejects an end before the start', () => {
    const result = submitSchema.safeParse({
      ...validSubmit,
      end_at: '2027-02-28T18:00:00+01:00',
    })
    expect(result.success).toBe(false)
  })

  it('requires a city for on-site events', () => {
    expect(submitSchema.safeParse({ ...validSubmit, city: undefined }).success).toBe(false)
  })

  it('allows an online event without a city', () => {
    const online = { ...validSubmit, city: undefined, country_code: undefined, format: 'online' as const }
    expect(submitSchema.safeParse(online).success).toBe(true)
  })

  it('rejects a filled honeypot', () => {
    const result = submitSchema.safeParse({ ...validSubmit, website: 'http://spam.example' })
    expect(result.success).toBe(false)
  })

  it('rejects more than five themes', () => {
    const result = submitSchema.safeParse({
      ...validSubmit,
      themes: ['ai', 'web', 'mobile', 'data', 'games', 'iot'],
    })
    expect(result.success).toBe(false)
  })
})

describe('csvRowSchema', () => {
  it('splits pipe separated themes', () => {
    const result = csvRowSchema.safeParse({
      name: 'Hack Kosice',
      start_at: '2027-04-16T09:00:00+02:00',
      end_at: '2027-04-17T18:00:00+02:00',
      timezone: 'Europe/Bratislava',
      format: 'onsite',
      city: 'Košice',
      country_code: 'SK',
      themes: 'ai|open',
      price_cents: '0',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.themes).toEqual(['ai', 'open'])
      expect(result.data.price_cents).toBe(0)
      expect(result.data.currency).toBe('EUR')
    }
  })
})
