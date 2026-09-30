import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { geocodeCacheKey } from '@/lib/geocode'
import { csvRowSchema } from '@/lib/validation/schemas'
import { cleanRow, readSeedRows } from '@/scripts/seed/rows'

const seedDir = join(process.cwd(), 'scripts/seed')
const rows = readSeedRows(seedDir)
const known: Record<string, { lat: number; lng: number; precision: string }> = JSON.parse(
  readFileSync(join(seedDir, 'geocodes.json'), 'utf8')
)

const label = (file: string, number: number, name: string | undefined) =>
  `${file} row ${number} (${name ?? '?'})`

describe('seed CSVs', () => {
  it('holds rows', () => {
    expect(rows.length).toBeGreaterThan(0)
  })

  // A pull request adds a row here. The seed skips a row that fails this check
  // and only says so in its output, so the event silently never reaches the
  // map. Catching it in CI is the point.
  it('every row passes the validation the seed applies', () => {
    const failures = rows.flatMap(({ file, number, raw }) => {
      const parsed = csvRowSchema.safeParse(cleanRow(raw))
      if (parsed.success) return []
      const fields = Object.keys(parsed.error.flatten().fieldErrors).join(', ')
      return [`${label(file, number, raw.name)}: ${fields}`]
    })
    expect(failures).toEqual([])
  })

  it('date_confidence is one of the known values', () => {
    const unknown = rows
      .filter(({ raw }) => !['confirmed', 'estimated', 'past'].includes(raw.date_confidence))
      .map(({ file, number, raw }) => `${label(file, number, raw.name)}: "${raw.date_confidence}"`)
    expect(unknown).toEqual([])
  })
})

describe('geocodes.json', () => {
  // The same box the geocoder biases its queries to (lib/geocode.ts).
  const BOX = { minLng: 9, maxLng: 25, minLat: 45, maxLat: 55 }

  it('holds points inside the region, under normalised keys', () => {
    const bad = Object.entries(known).flatMap(([key, point]) => {
      const inBox =
        point.lng >= BOX.minLng &&
        point.lng <= BOX.maxLng &&
        point.lat >= BOX.minLat &&
        point.lat <= BOX.maxLat
      const keyOk = key === key.trim().toLowerCase()
      const precisionOk = point.precision === 'venue' || point.precision === 'city'
      return inBox && keyOk && precisionOk ? [] : [key]
    })
    expect(bad).toEqual([])
  })

  // This is what lets a fresh clone seed without a network call. When it fails,
  // run `npm run seed` once against a local database: it looks the new address
  // up, caches it and writes it into geocodes.json, which goes in the same
  // commit as the CSV row.
  it('covers every on-site row, so the seed needs no network', () => {
    const missing = rows.flatMap(({ file, number, raw }) => {
      const parsed = csvRowSchema.safeParse(cleanRow(raw))
      if (!parsed.success || parsed.data.format === 'online') return []
      const key = geocodeCacheKey(parsed.data)
      return key && !known[key] ? [`${label(file, number, raw.name)}: "${key}"`] : []
    })
    expect(missing).toEqual([])
  })
})

describe('cleanRow', () => {
  it('drops empty cells', () => {
    expect(cleanRow({ name: 'Hack', prizes: '', capacity: '' })).toEqual({ name: 'Hack' })
  })

  it('reads a bare deadline as the end of that day in the event offset', () => {
    const cleaned = cleanRow({
      start_at: '2026-10-16T09:30:00+02:00',
      registration_deadline: '2026-10-01',
    })
    expect(cleaned.registration_deadline).toBe('2026-10-01T23:59:00+02:00')
  })

  it('leaves a full timestamp alone', () => {
    const cleaned = cleanRow({
      start_at: '2026-10-16T09:30:00+02:00',
      registration_deadline: '2026-10-01T12:00:00+02:00',
    })
    expect(cleaned.registration_deadline).toBe('2026-10-01T12:00:00+02:00')
  })
})
