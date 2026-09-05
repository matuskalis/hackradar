import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase'
import { checkRateLimit, clientKey, rateLimitHeaders } from '@/lib/rate-limit/limiter'
import { hackathonsQuerySchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  const verdict = await checkRateLimit(clientKey(request, 'hackathons'), 120, 60_000)
  const headers = rateLimitHeaders(verdict)

  if (!verdict.ok) {
    return Response.json({ error: 'Príliš veľa požiadaviek.' }, { status: 429, headers })
  }

  const query = hackathonsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  )
  if (!query.success) {
    return Response.json(
      { error: 'Neplatné parametre.', issues: query.error.flatten() },
      { status: 400, headers }
    )
  }

  const filters = query.data
  const db = await createServerSupabaseClient()

  const shared = {
    from_at: filters.from ?? new Date().toISOString(),
    to_at: filters.to ?? undefined,
    formats: filters.format ?? undefined,
    theme_filter: filters.themes ?? undefined,
    free_only: filters.free ?? false,
    eligibility_filter: filters.eligibility ?? undefined,
  }

  const { data, error } =
    'bbox' in filters
      ? await db.rpc('hackathons_in_bbox', {
          min_lng: filters.bbox[0],
          min_lat: filters.bbox[1],
          max_lng: filters.bbox[2],
          max_lat: filters.bbox[3],
          ...shared,
        })
      : await db.rpc('hackathons_within_radius', {
          center_lat: filters.lat,
          center_lng: filters.lng,
          radius_km: filters.radius,
          ...shared,
        })

  if (error) {
    console.error('hackathons query failed', error)
    return Response.json({ error: 'Dáta sa nepodarilo načítať.' }, { status: 500, headers })
  }

  return Response.json(
    { items: data ?? [], mode: 'bbox' in filters ? 'bbox' : 'radius' },
    { headers: { ...headers, 'Cache-Control': 'public, s-maxage=60' } }
  )
}
