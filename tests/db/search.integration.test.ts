/**
 * Runs the search functions and the row level security against a real local
 * Postgres with PostGIS, because that is where the geo logic lives: the radius
 * and bounding box queries are SQL, not TypeScript.
 *
 * Opt in by exporting the three variables `supabase status -o env` prints
 * (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY) or by having them in .env.local, with the stack
 * from `supabase start` running. Without them the suite is skipped, which is
 * what happens in CI. It refuses any URL that is not loopback, and it only
 * writes rows whose slug starts with "itest-", which it removes again.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Database } from '@/lib/db/database.types'

config({ path: '.env.local', quiet: true })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const isLoopback = (value: string | undefined) => {
  if (!value) return false
  try {
    return ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(value).hostname)
  } catch {
    return false
  }
}

const enabled = Boolean(url && anonKey && serviceKey && isLoopback(url))

const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = enabled ? createClient<Database>(url!, serviceKey!, options) : (null as never)
const anon = enabled ? createClient<Database>(url!, anonKey!, options) : (null as never)

const PREFIX = 'itest-'
const DAY_MS = 86_400_000

type Format = Database['public']['Enums']['hackathon_format']
type Status = Database['public']['Enums']['hackathon_status']

type Fixture = {
  key: string
  lat?: number
  lng?: number
  format?: Format
  status?: Status
  themes?: string[]
  price_cents?: number | null
  eligibility?: string
  startInDays?: number
  lengthDays?: number
}

/** City centres, WGS84. The query point is Bratislava. */
const BRATISLAVA = { lat: 48.1486, lng: 17.1077 }
const CITY = {
  vienna: { lat: 48.2082, lng: 16.3738 },
  brno: { lat: 49.1951, lng: 16.6068 },
  budapest: { lat: 47.4979, lng: 19.0402 },
  prague: { lat: 50.0755, lng: 14.4378 },
  kosice: { lat: 48.7164, lng: 21.2611 },
}

/** Great-circle distance in km. PostGIS measures on the spheroid, so the two differ by well under 0.5 percent. */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const runId = Math.random().toString(36).slice(2, 8)
const slugOf = (key: string) => `${PREFIX}${runId}-${key}`
const keyOf = (slug: string) => slug.replace(`${PREFIX}${runId}-`, '')

async function insert(fixture: Fixture) {
  const hasPoint = fixture.lat != null && fixture.lng != null
  const start = Date.now() + (fixture.startInDays ?? 30) * DAY_MS
  const { error } = await admin.from('hackathons').insert({
    slug: slugOf(fixture.key),
    name: `Fixture ${fixture.key}`,
    name_normalized: `fixture${fixture.key}`,
    start_at: new Date(start).toISOString(),
    end_at: new Date(start + (fixture.lengthDays ?? 2) * DAY_MS).toISOString(),
    timezone: 'Europe/Bratislava',
    format: fixture.format ?? 'onsite',
    location: hasPoint ? `SRID=4326;POINT(${fixture.lng} ${fixture.lat})` : null,
    location_precision: hasPoint ? 'venue' : null,
    themes: fixture.themes ?? [],
    price_cents: fixture.price_cents === undefined ? 0 : fixture.price_cents,
    eligibility: fixture.eligibility ?? null,
    source: 'manual',
    status: fixture.status ?? 'published',
  })
  if (error) throw error
}

async function removeFixtures(pattern = `${PREFIX}%`) {
  const { error } = await admin.from('hackathons').delete().like('slug', pattern)
  if (error) throw error
}

const mine = (slug: string | null) => slug?.startsWith(`${PREFIX}${runId}-`) ?? false
const near = <T extends { slug: string | null }>(rows: T[] | null): T[] =>
  (rows ?? []).filter((row) => mine(row.slug))
const keys = (rows: { slug: string | null }[] | null) =>
  near(rows).map((row) => keyOf(row.slug as string))

async function radius(args: Partial<Database['public']['Functions']['hackathons_within_radius']['Args']> = {}) {
  const { data, error } = await admin.rpc('hackathons_within_radius', {
    center_lat: BRATISLAVA.lat,
    center_lng: BRATISLAVA.lng,
    radius_km: 200,
    max_rows: 1000,
    ...args,
  })
  if (error) throw error
  return data
}

describe.skipIf(!enabled)('search against PostGIS', () => {
  beforeAll(async () => {
    await removeFixtures()

    await insert({ key: 'vienna', ...CITY.vienna })
    await insert({ key: 'budapest', ...CITY.budapest })
    await insert({ key: 'brno', ...CITY.brno })
    await insert({ key: 'prague', ...CITY.prague })
    await insert({ key: 'kosice', ...CITY.kosice })
    await insert({ key: 'online', format: 'online' })
    await insert({ key: 'pending', status: 'pending', lat: 48.15, lng: 17.11 })
    await insert({ key: 'rejected', status: 'rejected', lat: 48.15, lng: 17.11 })
    await insert({ key: 'cancelled', status: 'cancelled', lat: 48.15, lng: 17.11 })
    await insert({ key: 'ended', lat: 48.16, lng: 17.12, startInDays: -10, lengthDays: 2 })
    await insert({ key: 'hybrid-ai', format: 'hybrid', lat: 48.17, lng: 17.13, themes: ['ai', 'data'], price_cents: 5000, eligibility: 'students' })
    await insert({ key: 'unknown-price', lat: 48.18, lng: 17.14, price_cents: null })
  })

  afterAll(() => removeFixtures(`${PREFIX}${runId}-%`))

  describe('hackathons_within_radius', () => {
    it('returns what is inside the radius, nearest first, with the distance in km', async () => {
      const rows = near(await radius({ radius_km: 200, include_online: false }))
      const cities = rows.filter((row) => ['vienna', 'brno', 'budapest'].includes(keyOf(row.slug)))

      expect(cities.map((row) => keyOf(row.slug))).toEqual(['vienna', 'brno', 'budapest'])
      for (const row of cities) {
        const expected = haversineKm(BRATISLAVA, CITY[keyOf(row.slug) as keyof typeof CITY])
        expect(row.distance_km).toBeGreaterThan(expected * 0.995)
        expect(row.distance_km).toBeLessThan(expected * 1.005)
      }
    })

    it('leaves out what is beyond the radius', async () => {
      const inside = keys(await radius({ radius_km: 200, include_online: false }))
      expect(inside).not.toContain('prague')
      expect(inside).not.toContain('kosice')

      const small = keys(await radius({ radius_km: 100, include_online: false }))
      expect(small).toContain('vienna')
      expect(small).not.toContain('brno')
      expect(small).not.toContain('budapest')
    })

    it('puts online events last, without a distance, and only when asked to include them', async () => {
      const all = near(await radius({ include_online: true }))
      const last = all[all.length - 1]
      expect(keyOf(last.slug)).toBe('online')
      expect(last.distance_km).toBeNull()

      expect(keys(await radius({ include_online: false }))).not.toContain('online')
    })

    it('shows published events only', async () => {
      const shown = keys(await radius())
      for (const hidden of ['pending', 'rejected', 'cancelled']) {
        expect(shown).not.toContain(hidden)
      }
    })

    it('drops events that have ended, unless an earlier start is asked for', async () => {
      expect(keys(await radius())).not.toContain('ended')

      const earlier = await radius({ from_at: new Date(Date.now() - 30 * DAY_MS).toISOString() })
      expect(keys(earlier)).toContain('ended')
    })

    it('keeps only events that start by the end of the window', async () => {
      const soon = keys(await radius({ to_at: new Date(Date.now() + 7 * DAY_MS).toISOString() }))
      expect(soon).not.toContain('vienna')

      const later = keys(await radius({ to_at: new Date(Date.now() + 60 * DAY_MS).toISOString() }))
      expect(later).toContain('vienna')
    })

    it('filters by format, theme and audience', async () => {
      expect(keys(await radius({ formats: ['hybrid'] }))).toEqual(['hybrid-ai'])
      expect(keys(await radius({ theme_filter: ['ai'] }))).toEqual(['hybrid-ai'])
      expect(keys(await radius({ theme_filter: ['web', 'data'] }))).toEqual(['hybrid-ai'])
      expect(keys(await radius({ eligibility_filter: 'students' }))).toEqual(['hybrid-ai'])
    })

    it('counts a missing price as free, and a real price as not', async () => {
      const free = keys(await radius({ free_only: true }))
      expect(free).toContain('unknown-price')
      expect(free).toContain('vienna')
      expect(free).not.toContain('hybrid-ai')
    })

    it('honours max_rows', async () => {
      const rows = await radius({ max_rows: 2 })
      expect(rows).toHaveLength(2)
    })
  })

  describe('hackathons_in_bbox', () => {
    const box = { min_lng: 16, min_lat: 47.5, max_lng: 18, max_lat: 48.6 }

    async function inBox(extra: Partial<Database['public']['Functions']['hackathons_in_bbox']['Args']> = {}) {
      const { data, error } = await admin.rpc('hackathons_in_bbox', { ...box, max_rows: 1000, ...extra })
      if (error) throw error
      return data
    }

    it('returns located events inside the box and nothing outside it or without a place', async () => {
      const shown = keys(await inBox())
      expect(shown).toContain('vienna')
      expect(shown).toContain('hybrid-ai')
      for (const outside of ['brno', 'budapest', 'prague', 'kosice', 'online']) {
        expect(shown).not.toContain(outside)
      }
    })

    it('measures distance from the centre of the box', async () => {
      const rows = near(await inBox())
      const vienna = rows.find((row) => keyOf(row.slug) === 'vienna')!
      const centre = { lat: (box.min_lat + box.max_lat) / 2, lng: (box.min_lng + box.max_lng) / 2 }
      const expected = haversineKm(centre, CITY.vienna)
      expect(vienna.distance_km).toBeGreaterThan(expected * 0.995)
      expect(vienna.distance_km).toBeLessThan(expected * 1.005)
    })

    it('applies the same status and date rules', async () => {
      const shown = keys(await inBox())
      for (const hidden of ['pending', 'rejected', 'cancelled', 'ended']) {
        expect(shown).not.toContain(hidden)
      }
    })
  })

  describe('row level security', () => {
    it('lets the anonymous key read published events and only those', async () => {
      const { data, error } = await anon.from('hackathons_public').select('slug').like('slug', `${PREFIX}${runId}-%`)
      expect(error).toBeNull()
      const shown = keys(data)
      expect(shown).toContain('vienna')
      for (const hidden of ['pending', 'rejected', 'cancelled']) {
        expect(shown).not.toContain(hidden)
      }

      const table = await anon.from('hackathons').select('slug').like('slug', `${PREFIX}${runId}-%`)
      expect(keys(table.data)).not.toContain('pending')
    })

    it('runs the search with the anonymous key the API uses', async () => {
      const { data, error } = await anon.rpc('hackathons_within_radius', {
        center_lat: BRATISLAVA.lat,
        center_lng: BRATISLAVA.lng,
        radius_km: 200,
        max_rows: 1000,
      })
      expect(error).toBeNull()
      const shown = keys(data)
      expect(shown).toContain('vienna')
      expect(shown).not.toContain('pending')
    })

    it('does not expose internal columns through the public view', async () => {
      const { data } = await anon.from('hackathons_public').select('*').eq('slug', slugOf('vienna')).single()
      expect(data).not.toBeNull()
      for (const internal of ['name_normalized', 'source_id', 'extra_sources', 'created_at', 'location', 'status', 'edited_at']) {
        expect(Object.keys(data!)).not.toContain(internal)
      }
    })

    it('refuses anonymous writes', async () => {
      const insertion = await anon.from('hackathons').insert({
        slug: slugOf('anon-write'),
        name: 'Anonymous write',
        name_normalized: 'anonymouswrite',
        start_at: new Date(Date.now() + DAY_MS).toISOString(),
        end_at: new Date(Date.now() + 2 * DAY_MS).toISOString(),
        format: 'online',
        source: 'submit',
        status: 'published',
      })
      expect(insertion.error).not.toBeNull()

      await anon.from('hackathons').update({ name: 'Hijacked' }).eq('slug', slugOf('vienna'))
      const { data } = await admin.from('hackathons').select('name').eq('slug', slugOf('vienna')).single()
      expect(data?.name).toBe('Fixture vienna')
    })

    it('keeps the admin view and the rate limit function away from the anonymous key', async () => {
      const view = await anon.from('hackathons_admin').select('id').limit(1)
      expect(view.error).not.toBeNull()

      const bump = await anon.rpc('bump_rate_limit', { p_key: 'itest', p_window_start: new Date().toISOString() })
      expect(bump.error).not.toBeNull()
    })
  })

  describe('constraints', () => {
    it('will not publish an on-site event that has no place on the map', async () => {
      await expect(insert({ key: 'no-place', format: 'onsite', status: 'published' })).rejects.toMatchObject({
        code: '23514',
      })
    })

    it('lets the same event wait as pending without a place', async () => {
      await insert({ key: 'no-place-pending', format: 'onsite', status: 'pending' })
    })
  })
})
