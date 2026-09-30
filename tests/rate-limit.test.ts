import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, clientKey, rateLimitHeaders } from '@/lib/rate-limit/limiter'

// The limiter counts in the database and falls back to a per-instance counter
// when the database cannot be reached. Forcing the failure here tests the path a
// real outage takes, and keeps this suite off any database that happens to be
// configured in the shell.
vi.mock('@/lib/db/supabase', () => ({
  createAdminClient: () => {
    throw new Error('no database in this test')
  },
}))

const MINUTE = 60_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-01T10:00:10Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkRateLimit', () => {
  it('allows requests up to the limit and refuses the next one', async () => {
    const verdicts = []
    for (let i = 0; i < 5; i++) verdicts.push(await checkRateLimit('t:limit', 3, MINUTE))

    expect(verdicts.map((verdict) => verdict.ok)).toEqual([true, true, true, false, false])
    expect(verdicts.map((verdict) => verdict.remaining)).toEqual([2, 1, 0, 0, 0])
  })

  it('counts each key on its own', async () => {
    await checkRateLimit('t:a', 1, MINUTE)
    expect((await checkRateLimit('t:a', 1, MINUTE)).ok).toBe(false)
    expect((await checkRateLimit('t:b', 1, MINUTE)).ok).toBe(true)
  })

  it('starts a fresh count when the window rolls over', async () => {
    await checkRateLimit('t:window', 1, MINUTE)
    expect((await checkRateLimit('t:window', 1, MINUTE)).ok).toBe(false)

    vi.setSystemTime(new Date('2026-10-01T10:01:05Z'))
    expect((await checkRateLimit('t:window', 1, MINUTE)).ok).toBe(true)
  })

  it('says when the window ends', async () => {
    const verdict = await checkRateLimit('t:reset', 5, MINUTE)
    expect(verdict.resetAt.toISOString()).toBe('2026-10-01T10:01:00.000Z')
    expect(verdict.limit).toBe(5)
  })
})

describe('rateLimitHeaders', () => {
  it('reports the limit, what is left and the reset time in epoch seconds', async () => {
    const verdict = await checkRateLimit('t:headers', 4, MINUTE)
    expect(rateLimitHeaders(verdict)).toEqual({
      'X-RateLimit-Limit': '4',
      'X-RateLimit-Remaining': '3',
      'X-RateLimit-Reset': String(Date.parse('2026-10-01T10:01:00Z') / 1000),
    })
  })
})

describe('clientKey', () => {
  const request = (headers: Record<string, string>) => new Request('https://hackradar.test/', { headers })

  it('uses the first address of X-Forwarded-For, scoped to the route', () => {
    expect(clientKey(request({ 'x-forwarded-for': ' 203.0.113.7 , 10.0.0.1' }), 'submit')).toBe(
      'submit:203.0.113.7'
    )
  })

  it('falls back to one shared key when no address is forwarded', () => {
    expect(clientKey(request({}), 'ics')).toBe('ics:unknown')
  })
})
