import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assertDatabaseConfiguredForProduction,
  listPublishedSlugs,
  listUpcomingNear,
} from '@/lib/hackathons/repo'

const HERE = { lat: 48.15, lng: 17.11 }

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // Whatever the shell running the tests has exported, these are not a deployment.
  vi.stubEnv('VERCEL_ENV', undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// The city pages and the sitemap are prerendered during `next build`. A fresh
// clone, CI or a preview deployment with no environment variables yet must
// still build: these reads degrade to an empty result instead of failing.
describe('prerendered reads without a working database', () => {
  it('return empty results when Supabase is not configured at all', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    await expect(listUpcomingNear(HERE, 50)).resolves.toEqual([])
    await expect(listPublishedSlugs()).resolves.toEqual([])
  })

  it('return empty results in a Vercel preview with no variables', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    await expect(listUpcomingNear(HERE, 50)).resolves.toEqual([])
    await expect(listPublishedSlugs()).resolves.toEqual([])
  })

  // Only the RPC read: a failed GET is retried with backoff by the Supabase
  // client, which would make this case take seconds.
  it('return empty results when the database is unreachable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder')

    await expect(listUpcomingNear(HERE, 50)).resolves.toEqual([])
  })
})

// An empty, healthy-looking production site is worse than a failed deploy, so
// only a production deployment refuses to build without Supabase.
describe('assertDatabaseConfiguredForProduction', () => {
  const configured = {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54521',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder',
  }

  it.each([undefined, 'preview', 'development'])(
    'lets a build with VERCEL_ENV=%s go ahead without Supabase',
    (VERCEL_ENV) => {
      expect(() => assertDatabaseConfiguredForProduction({ VERCEL_ENV })).not.toThrow()
    }
  )

  it.each([
    ['nothing set', {}],
    ['only the URL', { NEXT_PUBLIC_SUPABASE_URL: configured.NEXT_PUBLIC_SUPABASE_URL }],
    ['only the anon key', { NEXT_PUBLIC_SUPABASE_ANON_KEY: configured.NEXT_PUBLIC_SUPABASE_ANON_KEY }],
    ['empty values', { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' }],
  ])('stops a production build with %s', (_case, variables) => {
    expect(() =>
      assertDatabaseConfiguredForProduction({ VERCEL_ENV: 'production', ...variables })
    ).toThrow(/production build/i)
  })

  it('lets a production build with both variables go ahead', () => {
    expect(() =>
      assertDatabaseConfiguredForProduction({ VERCEL_ENV: 'production', ...configured })
    ).not.toThrow()
  })
})

describe('prerendered reads in a production deployment', () => {
  it('fail the build when Supabase is not configured, instead of returning empty pages', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    await expect(listUpcomingNear(HERE, 50)).rejects.toThrow(/production build/i)
    await expect(listPublishedSlugs()).rejects.toThrow(/production build/i)
  })

  // Configured but briefly down is a different case: the deploy goes out and
  // the hourly regeneration fills the pages in once the database is back.
  it('still degrade when Supabase is configured but unreachable', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:1')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder')

    await expect(listUpcomingNear(HERE, 50)).resolves.toEqual([])
  })
})
