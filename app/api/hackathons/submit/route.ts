import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { upsertHackathon } from '@/lib/hackathons/upsert'
import { checkRateLimit, clientKey, rateLimitHeaders } from '@/lib/rate-limit/limiter'
import { submitSchema } from '@/lib/validation/schemas'
import { geocode } from '@/lib/geocode'

export async function POST(request: NextRequest) {
  const verdict = await checkRateLimit(clientKey(request, 'submit'), 5, 60 * 60_000)
  const headers = rateLimitHeaders(verdict)

  if (!verdict.ok) {
    return Response.json(
      { error: 'Príliš veľa odoslaní. Skúste to o hodinu.' },
      { status: 429, headers }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Neplatné dáta.' }, { status: 400, headers })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Skontrolujte vyplnené polia.', issues: parsed.error.flatten() },
      { status: 400, headers }
    )
  }

  const input = parsed.data
  const db = createAdminClient()

  // A failed lookup is not fatal: the row waits in the moderation queue and
  // the coordinates can be filled in before it is published.
  let point = null
  if (input.format !== 'online') {
    try {
      point = await geocode(db, {
        address: input.address,
        city: input.city,
        country_code: input.country_code,
      })
    } catch (error) {
      console.error('submit geocode failed', error)
    }
  }

  try {
    await upsertHackathon(db, {
      ...input,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      location_precision: point?.precision ?? null,
      source: 'submit',
      source_url: input.url,
      status: 'pending',
    })
  } catch (error) {
    console.error('submit insert failed', error)
    return Response.json(
      { error: 'Hackathon sa nepodarilo uložiť. Skúste to znova.' },
      { status: 500, headers }
    )
  }

  return Response.json({ ok: true }, { status: 201, headers })
}
