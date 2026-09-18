import { describe, expect, it } from 'vitest'
import {
  blankFormValues,
  formValuesFromExtraction,
  toIsoWithOffset,
} from '@/lib/admin/extracted-to-form'
import type { ExtractedFields } from '@/lib/extract/event-from-html'

describe('toIsoWithOffset', () => {
  it('keeps the instant of a date that already carries an offset', () => {
    expect(toIsoWithOffset('2027-04-16T09:00:00+02:00', 'Europe/Bratislava')).toBe(
      '2027-04-16T09:00:00+02:00'
    )
  })

  it('restates a UTC instant in the event timezone', () => {
    expect(toIsoWithOffset('2027-04-16T07:00:00Z', 'Europe/Bratislava')).toBe(
      '2027-04-16T09:00:00+02:00'
    )
  })

  it('reads a local time without an offset in the event timezone', () => {
    expect(toIsoWithOffset('2027-04-16T09:00:00', 'Europe/Warsaw')).toBe(
      '2027-04-16T09:00:00+02:00'
    )
  })

  it('uses winter time for a winter date in the same zone', () => {
    expect(toIsoWithOffset('2027-01-16T09:00:00', 'Europe/Bratislava')).toBe(
      '2027-01-16T09:00:00+01:00'
    )
  })

  it('treats a bare date as midnight in the event timezone', () => {
    expect(toIsoWithOffset('2027-04-16', 'Europe/Bratislava')).toBe(
      '2027-04-16T00:00:00+02:00'
    )
  })

  it('rejects text that is not a date', () => {
    expect(toIsoWithOffset('this spring', 'Europe/Bratislava')).toBeNull()
  })
})

describe('formValuesFromExtraction', () => {
  const full: ExtractedFields = {
    name: 'Hack Kosice 2027',
    description: 'Popis',
    start_at: '2027-04-16T09:00:00+02:00',
    end_at: '2027-04-18T18:00:00+02:00',
    timezone: 'Europe/Bratislava',
    format: 'onsite',
    venue_name: 'Aula Maxima',
    address: 'Letná 9',
    city: 'Košice',
    country_code: 'SK',
    url: 'https://hackkosice.com/',
    registration_url: 'https://hackkosice.com/apply',
    organizer_name: 'Hack Kosice',
    price_cents: 0,
    currency: 'EUR',
  }

  it('maps every extracted field onto the form', () => {
    expect(formValuesFromExtraction(full, 'https://hackkosice.com/')).toEqual({
      ...blankFormValues(),
      ...full,
      id: null,
      lat: null,
      lng: null,
    })
  })

  it('resolves dates in the timezone the extraction reported', () => {
    const values = formValuesFromExtraction(
      { ...full, timezone: 'Europe/Warsaw', start_at: '2027-04-16T09:00:00' },
      'https://example.com/'
    )
    expect(values.start_at).toBe('2027-04-16T09:00:00+02:00')
  })

  it('falls back to the Slovak timezone when the page states no country', () => {
    const values = formValuesFromExtraction(
      { name: 'Hackathon', start_at: '2027-04-16T09:00:00' },
      'https://example.com/event'
    )
    expect(values.timezone).toBe('Europe/Bratislava')
    expect(values.start_at).toBe('2027-04-16T09:00:00+02:00')
  })

  it('leaves unknown fields empty rather than guessing', () => {
    const values = formValuesFromExtraction({ name: 'Hackathon' }, 'https://example.com/event')
    expect(values.start_at).toBe('')
    expect(values.end_at).toBe('')
    expect(values.city).toBeNull()
    expect(values.country_code).toBeNull()
    expect(values.organizer_name).toBeNull()
  })

  it('defaults the format to on-site and the currency to euro', () => {
    const values = formValuesFromExtraction({}, 'https://example.com/event')
    expect(values.format).toBe('onsite')
    expect(values.currency).toBe('EUR')
  })

  it('uses the fetched page as the url when the page states none', () => {
    const values = formValuesFromExtraction({}, 'https://example.com/event')
    expect(values.url).toBe('https://example.com/event')
  })

  it('drops a date it cannot parse instead of writing junk into the form', () => {
    const values = formValuesFromExtraction(
      { name: 'Hackathon', start_at: 'jar 2027' },
      'https://example.com/event'
    )
    expect(values.start_at).toBe('')
  })
})
