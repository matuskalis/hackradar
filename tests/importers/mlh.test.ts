import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { currentSeason, parse } from '@/scripts/import/mlh'

const fixture = JSON.parse(readFileSync('tests/fixtures/mlh-2027.json', 'utf8'))

describe('mlh parse', () => {
  const items = parse(fixture)

  it('reads every upcoming event', () => {
    expect(items.length).toBe(fixture.props.upcomingEvents.length)
  })

  it('maps formatType to our format enum', () => {
    expect(new Set(items.map((item) => item.format))).toEqual(
      new Set(['onsite', 'online'])
    )
  })

  it('leaves online events without a place', () => {
    for (const item of items.filter((entry) => entry.format === 'online')) {
      expect(item.city).toBeNull()
      expect(item.country_code).toBeNull()
    }
  })

  it('marks on-site events as city precision, since MLH gives no street', () => {
    for (const item of items.filter((entry) => entry.format === 'onsite')) {
      expect(item.location_precision).toBe('city')
    }
  })

  it('keeps a stable source id and an absolute source url', () => {
    for (const item of items) {
      expect(item.source).toBe('mlh')
      expect(item.source_id).toMatch(/^[0-9a-f-]{20,}$/)
      if (item.source_url) expect(item.source_url).toMatch(/^https:\/\/www\.mlh\.com\//)
    }
  })

  it('produces ISO timestamps with end at or after start', () => {
    for (const item of items) {
      expect(Date.parse(item.start_at)).not.toBeNaN()
      expect(Date.parse(item.end_at)).toBeGreaterThanOrEqual(Date.parse(item.start_at))
    }
  })

  it('throws when the payload shape changes', () => {
    expect(() => parse({ props: {} })).toThrow(/upcomingEvents/)
  })

  it('rolls the season over in August', () => {
    expect(currentSeason(new Date('2026-07-15T00:00:00Z'))).toBe(2026)
    expect(currentSeason(new Date('2026-08-15T00:00:00Z'))).toBe(2027)
  })
})
