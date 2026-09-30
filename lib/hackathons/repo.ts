import { createAnonClient } from '@/lib/db/supabase'
import type { HackathonCard } from '@/lib/db/types'

/** Published event by slug, or null. Reads the public view, so RLS applies. */
export async function getPublishedBySlug(slug: string) {
  const db = createAnonClient()
  const { data, error } = await db
    .from('hackathons_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

type Env = Record<string, string | undefined>

/**
 * A production deployment built without Supabase configured would publish empty
 * city pages and an empty sitemap and look healthy doing it, so that build has
 * to fail. Every other build stays tolerant: a fresh clone, CI, a Vercel
 * preview. VERCEL_ENV is the only signal used. Vercel exposes it at build time
 * and at runtime while the project's system environment variables are enabled,
 * so a host or a project setup that does not provide it never trips the check.
 */
export function assertDatabaseConfiguredForProduction(env: Env = process.env): void {
  if (env.VERCEL_ENV !== 'production') return
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return

  throw new Error(
    'Production build without Supabase: set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY for the Production environment.'
  )
}

/**
 * City pages and the sitemap are prerendered at build time and regenerated
 * hourly (`revalidate = 3600` on both). A database that is unreachable, or
 * Supabase not configured at all (a fresh clone, CI, a Vercel preview), must not
 * fail the build, so these two degrade to an empty result and fill in at a
 * later regeneration once the database is reachable. The city page still works
 * in the meantime, because the map fetches its own data in the browser.
 *
 * The exception is a production deployment with no Supabase configuration,
 * which fails: see assertDatabaseConfiguredForProduction.
 *
 * getPublishedBySlug deliberately keeps throwing: a detail page with no event
 * should fail loudly rather than render as if the event did not exist.
 */
export async function listUpcomingNear(
  center: { lat: number; lng: number },
  radiusKm: number
): Promise<HackathonCard[]> {
  assertDatabaseConfiguredForProduction()
  try {
    const db = createAnonClient()
    const { data, error } = await db.rpc('hackathons_within_radius', {
      center_lat: center.lat,
      center_lng: center.lng,
      radius_km: radiusKm,
    })
    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error('listUpcomingNear failed, rendering without initial data', error)
    return []
  }
}

export async function listPublishedSlugs() {
  assertDatabaseConfiguredForProduction()
  try {
    const db = createAnonClient()
    const { data, error } = await db
      .from('hackathons_public')
      .select('slug, updated_at')
      // An event that has ended is no longer worth offering to a search engine.
      .gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error('listPublishedSlugs failed, sitemap will list static routes only', error)
    return []
  }
}
