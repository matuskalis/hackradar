import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/db/supabase'
import { rollRecurringEvents } from '@/lib/hackathons/recurrence'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Without the secret
 * configured nobody may run the job, so a misconfigured deploy fails closed
 * instead of exposing a write endpoint.
 */
function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header ?? '')
  // timingSafeEqual throws on a length mismatch, which leaks nothing a caller
  // does not already know: it chose the length.
  if (given.length !== expected.length) return false

  return timingSafeEqual(given, expected)
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get('authorization'))) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const counts = await rollRecurringEvents(createAdminClient(), new Date())

  return Response.json(counts, { headers: { 'Cache-Control': 'no-store' } })
}
