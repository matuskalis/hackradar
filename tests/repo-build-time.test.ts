import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listPublishedSlugs, listUpcomingNear } from '@/lib/hackathons/repo'

// The city pages and the sitemap are prerendered during `next build`. A fresh
// clone, or a preview deployment with no environment variables yet, must still
// build: these reads degrade to an empty result instead of failing the build.
describe('prerendered reads without a working database', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('return empty results when Supabase is not configured at all', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    await expect(listUpcomingNear({ lat: 48.15, lng: 17.11 }, 50)).resolves.toEqual([])
    await expect(listPublishedSlugs()).resolves.toEqual([])
  })

  // Only the RPC read: a failed GET is retried with backoff by the Supabase
  // client, which would make this case take seconds.
  it('return empty results when the database is unreachable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder')

    await expect(listUpcomingNear({ lat: 48.15, lng: 17.11 }, 50)).resolves.toEqual([])
  })
})
