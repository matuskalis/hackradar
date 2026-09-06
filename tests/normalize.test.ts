import { describe, expect, it } from 'vitest'
import {
  normalizeName,
  slugForEvent,
  slugify,
  urlHost,
  urlKey,
} from '@/lib/hackathons/normalize'
import { isSameEvent } from '@/lib/hackathons/upsert'

describe('slugify', () => {
  it('strips diacritics and punctuation', () => {
    expect(slugify('Hackathon Košice 2027')).toBe('hackathon-kosice-2027')
    expect(slugify('HackYeah — Kraków!')).toBe('hackyeah-krakow')
    expect(slugify('  Brno   Hack  ')).toBe('brno-hack')
  })
})

describe('slugForEvent', () => {
  it('appends the start year', () => {
    expect(slugForEvent('Hack Kosice', '2027-04-16T09:00:00+02:00')).toBe(
      'hack-kosice-2027'
    )
  })

  it('does not repeat a year already in the name', () => {
    expect(slugForEvent('Hack Kosice 2027', '2027-04-16T09:00:00+02:00')).toBe(
      'hack-kosice-2027'
    )
  })
})

describe('normalizeName', () => {
  it('collapses editions, years and diacritics to one key', () => {
    expect(normalizeName('Hack Košice 2027')).toBe('hackkosice')
    expect(normalizeName('HackKošice #8')).toBe('hackkosice')
    expect(normalizeName('HackYeah 2026')).toBe(normalizeName('HackYeah'))
  })

  it('keeps different events apart', () => {
    expect(normalizeName('Hack Kosice')).not.toBe(normalizeName('Hack Prague'))
  })
})

describe('urlHost', () => {
  it('drops the www prefix', () => {
    expect(urlHost('https://www.hackkosice.com/apply')).toBe('hackkosice.com')
    expect(urlHost('https://hackkosice.com/')).toBe('hackkosice.com')
  })

  it('returns null for unusable input', () => {
    expect(urlHost(null)).toBeNull()
    expect(urlHost('not a url')).toBeNull()
  })
})

describe('urlKey', () => {
  it('keeps the path so two events on one platform stay apart', () => {
    expect(urlKey('https://unstop.com/hackathons/alpha-123')).not.toBe(
      urlKey('https://unstop.com/hackathons/beta-456')
    )
  })

  it('ignores www, query, fragment and a trailing slash', () => {
    expect(urlKey('https://www.hackkosice.com/apply/?utm_source=x#top')).toBe(
      urlKey('https://hackkosice.com/apply')
    )
  })
})

describe('isSameEvent', () => {
  const existing = {
    name_normalized: 'hackkosice',
    registration_url: 'https://hackkosice.com/apply',
    url: 'https://hackkosice.com/',
    start_at: '2027-04-16T07:00:00Z',
    city: 'Košice',
  }

  it('matches a renamed edition starting the same day', () => {
    expect(
      isSameEvent(existing, {
        name: 'HackKošice #8',
        start_at: '2027-04-16T08:00:00Z',
        registration_url: null,
        url: null,
        city: 'Kosice',
      })
    ).toBe(true)
  })

  it('matches on registration host when the name differs', () => {
    expect(
      isSameEvent(existing, {
        name: 'Completely Different Name',
        start_at: '2027-04-17T06:00:00Z',
        registration_url: 'https://www.hackkosice.com/apply',
        url: null,
        city: null,
      })
    ).toBe(true)
  })

  it('rejects a match more than a day apart', () => {
    expect(
      isSameEvent(existing, {
        name: 'Hack Kosice',
        start_at: '2027-04-18T08:00:00Z',
        registration_url: null,
        url: null,
        city: 'Košice',
      })
    ).toBe(false)
  })

  it('rejects a different event on the same day', () => {
    expect(
      isSameEvent(existing, {
        name: 'Prague Blockchain Hack',
        start_at: '2027-04-16T08:00:00Z',
        registration_url: 'https://pragueblockchain.cz/register',
        url: null,
        city: 'Praha',
      })
    ).toBe(false)
  })

  it('keeps two events hosted on the same platform apart', () => {
    const alpha = {
      name_normalized: 'alphahack',
      registration_url: 'https://unstop.com/hackathons/alpha-123',
      url: null,
      start_at: '2026-09-03T09:00:00Z',
      city: null,
    }

    expect(
      isSameEvent(alpha, {
        name: 'Beta Challenge',
        start_at: '2026-09-03T09:00:00Z',
        registration_url: 'https://unstop.com/hackathons/beta-456',
        url: null,
        city: null,
      })
    ).toBe(false)
  })

  it('keeps parallel city editions apart despite a shared signup domain', () => {
    const brno = {
      name_normalized: 'rakathonbrno',
      registration_url: 'https://registrace.rakathon.cz/register',
      url: 'https://www.rakathon.cz/',
      start_at: '2026-10-16T07:30:00Z',
      city: 'Brno',
    }

    expect(
      isSameEvent(brno, {
        name: 'Rakathon 2026 (Praha)',
        start_at: '2026-10-16T07:30:00Z',
        registration_url: 'https://registrace.rakathon.cz/register',
        url: 'https://www.rakathon.cz/',
        city: 'Praha',
      })
    ).toBe(false)
  })
})
