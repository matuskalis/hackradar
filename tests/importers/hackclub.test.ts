import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from '@/scripts/import/hackclub'

const fixture = JSON.parse(readFileSync('tests/fixtures/hackclub-upcoming.json', 'utf8'))

describe('hackclub parse', () => {
  const items = parse(fixture)

  it('reads every event', () => {
    expect(items).toHaveLength(fixture.length)
  })

  it('uses the coordinates the API ships, so no geocoding is needed', () => {
    const onsite = items.filter((item) => item.format !== 'online')
    expect(onsite.length).toBeGreaterThan(0)
    for (const item of onsite) {
      if (item.lat != null) {
        expect(item.location_precision).toBe('venue')
        expect(Math.abs(item.lng!)).toBeLessThanOrEqual(180)
      }
    }
  })

  it('maps the virtual flag to the online format', () => {
    const virtualCount = fixture.filter((event: { virtual: boolean }) => event.virtual).length
    expect(items.filter((item) => item.format === 'online')).toHaveLength(virtualCount)
  })

  it('rejects a payload that is not an array', () => {
    expect(() => parse({ events: [] })).toThrow(/array/)
  })
})
