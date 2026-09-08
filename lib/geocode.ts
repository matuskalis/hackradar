import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type Db = SupabaseClient<Database>
type Precision = Database['public']['Enums']['location_precision']

export type GeocodeResult = { lat: number; lng: number; precision: Precision }

/** Central Europe, so a bare city name resolves here and not in the US. */
const BBOX = '9,45,25,55'
const MIN_INTERVAL_MS = 1100

let lastRequestAt = 0

async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now()
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastRequestAt = Date.now()
}

async function askPhoton(query: string): Promise<unknown> {
  await throttle()
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '1')
  url.searchParams.set('bbox', BBOX)
  url.searchParams.set('lang', 'en')

  const response = await fetch(url, {
    headers: { 'User-Agent': 'HackRadar/0.1 (hackathon map, central europe)' },
  })
  if (!response.ok) {
    throw new Error(`photon ${response.status} for "${query}"`)
  }
  return response.json()
}

function readPoint(payload: unknown): { lat: number; lng: number } | null {
  const feature = (payload as { features?: Array<{ geometry?: { coordinates?: number[] } }> })
    ?.features?.[0]
  const coords = feature?.geometry?.coordinates
  if (!coords || coords.length < 2) return null
  return { lng: coords[0], lat: coords[1] }
}

/**
 * Resolves an address to coordinates, caching every lookup (hits and misses)
 * in the database so repeated seed and import runs stay off the public Photon
 * instance, which throttles heavy use.
 */
export async function geocode(
  db: Db,
  parts: { address?: string | null; city?: string | null; country_code?: string | null }
): Promise<GeocodeResult | null> {
  const hasStreet = Boolean(parts.address?.trim())
  const query = [parts.address, parts.city, parts.country_code]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
  if (!query) return null

  const cacheKey = query.toLowerCase()
  const { data: cached, error: cacheError } = await db
    .from('geocode_cache')
    .select('lat, lng, precision')
    .eq('query', cacheKey)
    .maybeSingle()
  if (cacheError) throw cacheError

  if (cached) {
    return cached.lat != null && cached.lng != null
      ? { lat: cached.lat, lng: cached.lng, precision: cached.precision ?? 'city' }
      : null
  }

  const raw = await askPhoton(query)
  const point = readPoint(raw)
  const precision: Precision = hasStreet ? 'venue' : 'city'

  const { error: writeError } = await db.from('geocode_cache').insert({
    query: cacheKey,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    precision: point ? precision : null,
    raw: raw as never,
  })
  if (writeError) throw writeError

  return point ? { ...point, precision } : null
}
