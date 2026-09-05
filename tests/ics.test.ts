import { describe, expect, it } from 'vitest'
import { toIcs } from '@/lib/ics'

const base = {
  id: '11111111-2222-3333-4444-555555555555',
  name: 'Hack Košice 2027',
  start_at: '2027-04-16T07:00:00Z',
  end_at: '2027-04-17T16:00:00Z',
  url: 'https://hackkosice.com/',
  venue_name: 'Univerzitná knižnica',
  city: 'Košice',
}

describe('toIcs', () => {
  it('writes UTC timestamps without separators', () => {
    const ics = toIcs(base, 'https://hackradar.sk')
    expect(ics).toContain('DTSTART:20270416T070000Z')
    expect(ics).toContain('DTEND:20270417T160000Z')
  })

  it('uses CRLF line endings and closes the calendar', () => {
    const ics = toIcs(base, 'https://hackradar.sk')
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('escapes commas and semicolons in text fields', () => {
    const ics = toIcs(
      { ...base, description: 'Prines laptop, spacák; nabíjačku' },
      'https://hackradar.sk'
    )
    expect(ics).toContain('DESCRIPTION:Prines laptop\\, spacák\\; nabíjačku')
  })

  it('escapes newlines rather than breaking the record', () => {
    const ics = toIcs({ ...base, description: 'Prvý riadok\nDruhý riadok' }, 'https://x.sk')
    expect(ics).toContain('\\nDruhý')
    expect(ics.split('\r\n').filter((line) => line.startsWith('DESCRIPTION'))).toHaveLength(1)
  })

  it('joins the location parts it has', () => {
    const ics = toIcs(base, 'https://hackradar.sk')
    expect(ics).toContain('LOCATION:Univerzitná knižnica\\, Košice')
  })

  it('folds long lines to 75 octets, continuations starting with a space', () => {
    const ics = toIcs(
      { ...base, description: 'Ďalší veľmi dlhý popis s diakritikou. '.repeat(8) },
      'https://hackradar.sk'
    )
    const encoder = new TextEncoder()
    for (const line of ics.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
    }
    expect(ics).toContain('\r\n ')
  })
})
