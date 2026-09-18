import { describe, expect, it } from 'vitest'
import {
  columnsForUpdate,
  type ExistingColumns,
  type HackathonColumns,
} from '@/lib/hackathons/upsert'

const incoming: HackathonColumns = {
  name: 'Hack Kosice 2027',
  name_normalized: 'hackkosice',
  description: 'Popis zo seedu',
  start_at: '2027-04-16T09:00:00+02:00',
  end_at: '2027-04-18T18:00:00+02:00',
  timezone: 'Europe/Bratislava',
  format: 'onsite',
  venue_name: 'Aula Maxima',
  address: 'Letná 9',
  city: 'Košice',
  country_code: 'SK',
  location: 'SRID=4326;POINT(21.2611 48.7164)',
  location_precision: 'venue',
  url: 'https://hackkosice.com/',
  registration_url: 'https://hackkosice.com/apply',
  registration_deadline: '2027-04-01T23:59:00+02:00',
  themes: ['ai'],
  eligibility: 'students',
  price_cents: 0,
  currency: 'EUR',
  prizes: '5000 EUR',
  capacity: 300,
  organizer_name: 'Hack Kosice',
  source: 'manual',
  source_id: null,
  source_url: 'https://hackkosice.com/',
  status: 'published',
}

/** A row that already carries every value the incoming record has. */
const existing: ExistingColumns = {
  edited_at: null,
  description: 'Starý popis',
  venue_name: 'Stará budova',
  address: 'Stará 1',
  city: 'Kosice',
  country_code: 'SK',
  url: 'https://old.example/',
  registration_url: 'https://old.example/apply',
  registration_deadline: '2027-03-01T23:59:00+02:00',
  eligibility: 'open',
  price_cents: 1000,
  prizes: '1000 EUR',
  capacity: 100,
  organizer_name: 'Starý organizátor',
  location: 'SRID=4326;POINT(21.0 48.0)',
  location_precision: 'city',
}

const edited: ExistingColumns = { ...existing, edited_at: '2026-09-14T10:00:00Z' }

describe('columnsForUpdate', () => {
  it('never overwrites the status of an existing row', () => {
    expect(columnsForUpdate(existing, incoming)).not.toHaveProperty('status')
    expect(columnsForUpdate(edited, incoming)).not.toHaveProperty('status')
  })

  it('rewrites every other column of a row nobody edited', () => {
    const columns = columnsForUpdate(existing, incoming)

    expect(columns.name).toBe('Hack Kosice 2027')
    expect(columns.description).toBe('Popis zo seedu')
    expect(columns.city).toBe('Košice')
    expect(columns.location).toBe('SRID=4326;POINT(21.2611 48.7164)')
    expect(columns.start_at).toBe('2027-04-16T09:00:00+02:00')
  })

  it('changes nothing on an edited row that has no empty column', () => {
    expect(columnsForUpdate(edited, incoming)).toEqual({})
  })

  it('fills only the empty columns of an edited row', () => {
    const columns = columnsForUpdate(
      { ...edited, description: null, capacity: null },
      incoming
    )

    expect(columns).toEqual({ description: 'Popis zo seedu', capacity: 300 })
  })

  it('leaves the hand-corrected name and pin of an edited row alone', () => {
    const columns = columnsForUpdate({ ...edited, description: null }, incoming)

    expect(columns).not.toHaveProperty('name')
    expect(columns).not.toHaveProperty('location')
    expect(columns).not.toHaveProperty('start_at')
  })

  it('gives an edited row without a pin the incoming coordinates', () => {
    const columns = columnsForUpdate(
      { ...edited, location: null, location_precision: null },
      incoming
    )

    expect(columns.location).toBe('SRID=4326;POINT(21.2611 48.7164)')
    expect(columns.location_precision).toBe('venue')
  })
})
