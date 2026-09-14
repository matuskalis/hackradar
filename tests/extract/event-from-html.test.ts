import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  attendanceModeToFormat,
  countryCodeFromName,
  decodeEntities,
  extractEventFromHtml,
} from '@/lib/extract/event-from-html'

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../fixtures/extract/${name}`, import.meta.url)), 'utf8')

describe('extractEventFromHtml with JSON-LD', () => {
  const result = extractEventFromHtml(
    fixture('graph-event.html'),
    'https://hackbuild.example.sk/2027'
  )

  it('finds an Event subtype nested in @graph', () => {
    expect(result.fields.name).toBe('Hack & Build 2027')
    expect(result.fields.organizer_name).toBe('FIIT STU')
    expect(result.fields.format).toBe('onsite')
  })

  it('decodes HTML entities in JSON-LD text', () => {
    expect(result.fields.description).toBe('48 hodín kódovania v Bratislave.')
  })

  it('keeps dates as ISO 8601 with an offset', () => {
    expect(result.fields.start_at).toBe('2027-03-05T17:00:00+01:00')
    expect(result.fields.end_at).toBe('2027-03-07T14:00:00+01:00')
    expect(result.warnings).toEqual([])
  })

  it('maps the address and derives the timezone from the country', () => {
    expect(result.fields.venue_name).toBe('FIIT STU, Blok A')
    expect(result.fields.address).toBe('Ilkovičova 2')
    expect(result.fields.city).toBe('Bratislava')
    expect(result.fields.country_code).toBe('SK')
    expect(result.fields.timezone).toBe('Europe/Bratislava')
  })

  it('reads the offer and resolves relative urls against the page', () => {
    expect(result.fields.price_cents).toBe(1500)
    expect(result.fields.currency).toBe('EUR')
    expect(result.fields.url).toBe('https://hackbuild.example.sk/2027')
    expect(result.fields.registration_url).toBe('https://tickets.example.sk/hackbuild-2027')
  })

  it('reports nothing missing for a complete page', () => {
    expect(result.missing).toEqual([])
  })
})

describe('extractEventFromHtml with OpenGraph only', () => {
  const result = extractEventFromHtml(
    fixture('opengraph-only.html'),
    'https://datahack.example.cz/2027'
  )

  it('falls back to og tags', () => {
    expect(result.fields.name).toBe('Brno Data Hack 2027')
    expect(result.fields.description).toBe('Víkendový hackathon nad otevřenými daty.')
    expect(result.fields.organizer_name).toBe('Databáze Brno z.s.')
    expect(result.fields.url).toBe('https://datahack.example.cz/2027')
  })

  it('takes the start from event:start_time and the end from <time datetime>', () => {
    expect(result.fields.start_at).toBe('2027-05-14T18:00:00+02:00')
    expect(result.fields.end_at).toBe('2027-05-16T15:00:00+02:00')
  })

  it('lists the fields it could not find', () => {
    expect(result.missing).toContain('format')
    expect(result.missing).toContain('city')
    expect(result.missing).not.toContain('name')
    expect(result.missing).not.toContain('start_at')
  })
})

describe('extractEventFromHtml with no event data', () => {
  const result = extractEventFromHtml(fixture('no-event.html'), 'https://blog.example.com/posts/1')

  it('returns only the page url and reports every required field missing', () => {
    expect(result.fields.url).toBe('https://blog.example.com/posts/1')
    expect(result.fields.start_at).toBeUndefined()
    expect(result.fields.format).toBeUndefined()
    expect(result.missing).toEqual([
      'start_at',
      'end_at',
      'timezone',
      'format',
      'organizer_name',
      'city',
      'country_code',
    ])
  })
})

describe('extractEventFromHtml with malformed JSON-LD', () => {
  const result = extractEventFromHtml(fixture('malformed-jsonld.html'), 'https://aijam.example.at/')

  it('does not throw and warns about the broken block', () => {
    expect(result.warnings.some((warning) => warning.includes('not valid JSON'))).toBe(true)
  })

  it('still reads the valid sibling block', () => {
    expect(result.fields.name).toBe('Vienna AI Jam 2027')
    expect(result.fields.format).toBe('hybrid')
    expect(result.fields.city).toBe('Wien')
    expect(result.fields.country_code).toBe('AT')
    expect(result.fields.organizer_name).toBe('AI Vienna')
  })

  it('keeps an offsetless date and warns instead of guessing a zone', () => {
    expect(result.fields.start_at).toBe('2027-09-11T09:00')
    expect(result.warnings.some((warning) => warning.includes('has no UTC offset'))).toBe(true)
  })
})

describe('countryCodeFromName', () => {
  it('maps codes, English names and local names', () => {
    expect(countryCodeFromName('SK')).toBe('SK')
    expect(countryCodeFromName('Slovakia')).toBe('SK')
    expect(countryCodeFromName('Slovensko')).toBe('SK')
    expect(countryCodeFromName('Česká republika')).toBe('CZ')
    expect(countryCodeFromName('Czech Republic')).toBe('CZ')
    expect(countryCodeFromName('Österreich')).toBe('AT')
    expect(countryCodeFromName('Magyarország')).toBe('HU')
    expect(countryCodeFromName('Polska')).toBe('PL')
    expect(countryCodeFromName('Deutschland')).toBe('DE')
    expect(countryCodeFromName('DEU')).toBe('DE')
  })

  it('returns undefined for a country we do not publish', () => {
    expect(countryCodeFromName('France')).toBeUndefined()
    expect(countryCodeFromName('')).toBeUndefined()
    expect(countryCodeFromName(undefined)).toBeUndefined()
  })
})

describe('attendanceModeToFormat', () => {
  it('maps the three schema.org modes', () => {
    expect(attendanceModeToFormat('https://schema.org/OnlineEventAttendanceMode')).toBe('online')
    expect(attendanceModeToFormat('OfflineEventAttendanceMode')).toBe('onsite')
    expect(attendanceModeToFormat(['https://schema.org/MixedEventAttendanceMode'])).toBe('hybrid')
  })

  it('ignores anything else', () => {
    expect(attendanceModeToFormat('SomethingElse')).toBeUndefined()
    expect(attendanceModeToFormat(undefined)).toBeUndefined()
  })
})

describe('decodeEntities', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('Hack &amp; Build &#8211; 2027')).toBe('Hack & Build – 2027')
    expect(decodeEntities('k&oacute;d &#x26; dáta')).toBe('kód & dáta')
  })

  it('leaves text without entities untouched', () => {
    expect(decodeEntities('a < b')).toBe('a < b')
  })
})
