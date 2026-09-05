import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { checkRateLimit, clientKey, rateLimitHeaders } from '@/lib/rate-limit/limiter'
import { geocodeQuerySchema } from '@/lib/validation/schemas'

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: { name?: string; city?: string; country?: string; state?: string }
}

export type CitySuggestion = {
  name: string
  region: string | null
  country: string | null
  lat: number
  lng: number
}

/** Central Europe, so a bare city name resolves here and not in the US. */
const BBOX = '9,45,25,55'

function toSuggestions(payload: unknown): CitySuggestion[] {
  const features = (payload as { features?: PhotonFeature[] })?.features ?? []

  return features.flatMap((feature) => {
    const coords = feature.geometry?.coordinates
    const name = feature.properties?.name ?? feature.properties?.city
    if (!coords || coords.length < 2 || !name) return []

    return [
      {
        name,
        region: feature.properties?.state ?? null,
        country: feature.properties?.country ?? null,
        lng: coords[0],
        lat: coords[1],
      },
    ]
  })
}

export async function GET(request: NextRequest) {
  const verdict = await checkRateLimit(clientKey(request, 'geocode'), 30, 60_000)
  const headers = rateLimitHeaders(verdict)

  if (!verdict.ok) {
    return Response.json({ error: 'Príliš veľa požiadaviek.' }, { status: 429, headers })
  }

  const query = geocodeQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  )
  if (!query.success) {
    return Response.json(
      { error: 'Neplatný dopyt.', issues: query.error.flatten() },
      { status: 400, headers }
    )
  }

  const cacheKey = `city:${query.data.q.toLowerCase()}`
  const db = createAdminClient()

  const { data: cached } = await db
    .from('geocode_cache')
    .select('raw')
    .eq('query', cacheKey)
    .maybeSingle()

  if (cached?.raw) {
    return Response.json(
      { results: toSuggestions(cached.raw) },
      { headers: { ...headers, 'Cache-Control': 'public, s-maxage=86400' } }
    )
  }

  const photon = new URL('https://photon.komoot.io/api/')
  photon.searchParams.set('q', query.data.q)
  photon.searchParams.set('limit', '5')
  photon.searchParams.set('bbox', BBOX)
  photon.searchParams.set('lang', 'en')
  photon.searchParams.append('osm_tag', 'place:city')
  photon.searchParams.append('osm_tag', 'place:town')

  let payload: unknown
  try {
    const response = await fetch(photon, {
      headers: { 'User-Agent': 'HackRadar/0.1 (hackathon map, central europe)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`photon ${response.status}`)
    payload = await response.json()
  } catch (error) {
    console.error('geocode lookup failed', error)
    return Response.json(
      { error: 'Vyhľadávanie miest je dočasne nedostupné.' },
      { status: 502, headers }
    )
  }

  await db
    .from('geocode_cache')
    .upsert({ query: cacheKey, raw: payload as never }, { onConflict: 'query' })

  return Response.json(
    { results: toSuggestions(payload) },
    { headers: { ...headers, 'Cache-Control': 'public, s-maxage=86400' } }
  )
}
