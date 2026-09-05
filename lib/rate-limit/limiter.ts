import { createAdminClient } from '@/lib/db/supabase'

export type RateLimitVerdict = {
  ok: boolean
  limit: number
  remaining: number
  resetAt: Date
}

const memory = new Map<string, number>()

/** Falls back to a per-instance counter when the database is unreachable. */
function bumpInMemory(bucketKey: string): number {
  const next = (memory.get(bucketKey) ?? 0) + 1
  memory.set(bucketKey, next)
  if (memory.size > 10_000) memory.clear()
  return next
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitVerdict> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const bucketKey = `${key}:${windowStart.toISOString()}`

  let count: number
  try {
    const db = createAdminClient()
    const { data, error } = await db.rpc('bump_rate_limit', {
      p_key: key,
      p_window_start: windowStart.toISOString(),
    })
    if (error) throw error
    count = data ?? bumpInMemory(bucketKey)
  } catch {
    count = bumpInMemory(bucketKey)
  }

  return {
    ok: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(windowStart.getTime() + windowMs),
  }
}

export function rateLimitHeaders(verdict: RateLimitVerdict): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(verdict.limit),
    'X-RateLimit-Remaining': String(verdict.remaining),
    'X-RateLimit-Reset': String(Math.floor(verdict.resetAt.getTime() / 1000)),
  }
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `${scope}:${ip}`
}
